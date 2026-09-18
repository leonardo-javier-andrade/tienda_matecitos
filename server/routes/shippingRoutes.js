const express = require('express');
const router = express.Router();

// ─── EnvioPack API Helper ──────────────────────────────
const ENVIOPACK_API = 'https://api.enviopack.com';

let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiraEn: 0,
};

// Obtener access token (con cache de 3.5 horas)
async function obtenerToken() {
  const ahora = Date.now();

  // Si el token aún es válido, reusar
  if (tokenCache.accessToken && ahora < tokenCache.expiraEn) {
    return tokenCache.accessToken;
  }

  // Si tenemos refresh token, intentar renovar primero
  if (tokenCache.refreshToken) {
    try {
      const res = await fetch(
        `${ENVIOPACK_API}/token/refresh?refresh_token=${tokenCache.refreshToken}`,
        { method: 'POST' }
      );
      if (res.ok) {
        const data = await res.json();
        tokenCache.accessToken = data.token;
        tokenCache.refreshToken = data.refresh_token || tokenCache.refreshToken;
        tokenCache.expiraEn = ahora + 3.5 * 60 * 60 * 1000; // 3.5 horas
        return tokenCache.accessToken;
      }
    } catch {
      // Si falla el refresh, caemos al login normal
    }
  }

  // Login con api-key y secret-key
  const apiKey = process.env.ENVIOPACK_API_KEY;
  const secretKey = process.env.ENVIOPACK_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Credenciales de EnvioPack no configuradas.');
  }

  const res = await fetch(`${ENVIOPACK_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `api-key=${encodeURIComponent(apiKey)}&secret-key=${encodeURIComponent(secretKey)}`,
  });

  if (!res.ok) {
    throw new Error(`Error al autenticar con EnvioPack: ${res.status}`);
  }

  const data = await res.json();
  tokenCache.accessToken = data.token;
  tokenCache.refreshToken = data.refresh_token;
  tokenCache.expiraEn = ahora + 3.5 * 60 * 60 * 1000;

  return tokenCache.accessToken;
}

// ─── GET /api/shipping/cotizar ─────────────────────────
// Cotizar envío a domicilio
// Query params: provincia, codigo_postal, peso, paquetes (opcional)
router.get('/cotizar', async (req, res) => {
  try {
    const { provincia, codigo_postal, peso, paquetes } = req.query;

    if (!provincia || !codigo_postal || !peso) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan parámetros: provincia, codigo_postal y peso son obligatorios.',
      });
    }

    const token = await obtenerToken();

    // Armar query string
    const params = new URLSearchParams({
      provincia,
      codigo_postal,
      peso,
      access_token: token,
    });

    if (paquetes) params.append('paquetes', paquetes);

    // Cotizar precio al comprador (a domicilio)
    const resDomicilio = await fetch(
      `${ENVIOPACK_API}/cotizar/precio/a-domicilio?${params.toString()}`
    );

    if (!resDomicilio.ok) {
      const errText = await resDomicilio.text();
      console.error('Error EnvioPack cotización domicilio:', errText);
      return res.status(502).json({
        exito: false,
        mensaje: 'Error al cotizar envío a domicilio.',
      });
    }

    const cotizaciones = await resDomicilio.json();

    // Formatear respuesta
    const opciones = Array.isArray(cotizaciones)
      ? cotizaciones.map((c) => ({
          servicio: c.servicio === 'N' ? 'Estándar' : c.servicio === 'P' ? 'Prioritario' : c.servicio === 'X' ? 'Express' : c.servicio,
          valor: c.valor,
          horasEntrega: c.horas_entrega,
          modalidad: 'Domicilio',
          correo: c.correo || '',
          servicioId: c.servicio,
        }))
      : [];

    res.json({
      exito: true,
      cantidad: opciones.length,
      datos: opciones,
    });
  } catch (error) {
    console.error('Error al cotizar envío:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al cotizar envío.' });
  }
});

// ─── GET /api/shipping/cotizar-sucursal ────────────────
// Cotizar envío a sucursal
// Query params: provincia, localidad, peso, paquetes (opcional)
router.get('/cotizar-sucursal', async (req, res) => {
  try {
    const { provincia, localidad, peso, paquetes, correo } = req.query;

    if (!provincia || !localidad || !peso) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan parámetros: provincia, localidad y peso son obligatorios.',
      });
    }

    const token = await obtenerToken();

    const params = new URLSearchParams({
      provincia,
      localidad,
      peso,
      access_token: token,
    });

    if (paquetes) params.append('paquetes', paquetes);
    if (correo) params.append('correo', correo);

    const resSucursal = await fetch(
      `${ENVIOPACK_API}/cotizar/precio/a-sucursal?${params.toString()}`
    );

    if (!resSucursal.ok) {
      const errText = await resSucursal.text();
      console.error('Error EnvioPack cotización sucursal:', errText);
      return res.status(502).json({
        exito: false,
        mensaje: 'Error al cotizar envío a sucursal.',
      });
    }

    const cotizaciones = await resSucursal.json();

    const opciones = Array.isArray(cotizaciones)
      ? cotizaciones.map((c) => ({
          servicio: c.servicio === 'N' ? 'Estándar' : c.servicio === 'P' ? 'Prioritario' : c.servicio === 'X' ? 'Express' : c.servicio,
          valor: c.valor,
          horasEntrega: c.horas_entrega,
          modalidad: 'Sucursal',
          correo: c.correo || '',
          servicioId: c.servicio,
          sucursal: c.sucursal || null,
        }))
      : [];

    res.json({
      exito: true,
      cantidad: opciones.length,
      datos: opciones,
    });
  } catch (error) {
    console.error('Error al cotizar envío a sucursal:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al cotizar envío a sucursal.' });
  }
});

// ─── GET /api/shipping/provincias ──────────────────────
// Obtener listado de provincias con sus IDs
router.get('/provincias', async (_req, res) => {
  try {
    const token = await obtenerToken();
    const response = await fetch(
      `${ENVIOPACK_API}/provincias?access_token=${token}`
    );

    if (!response.ok) {
      throw new Error(`Error al obtener provincias: ${response.status}`);
    }

    const provincias = await response.json();
    res.json({ exito: true, datos: provincias });
  } catch (error) {
    console.error('Error al obtener provincias:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener provincias.' });
  }
});

// ─── GET /api/shipping/localidades ─────────────────────
// Obtener localidades de una provincia
// Query params: provincia
router.get('/localidades', async (req, res) => {
  try {
    const { provincia } = req.query;

    if (!provincia) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El parámetro provincia es obligatorio.',
      });
    }

    const token = await obtenerToken();
    const response = await fetch(
      `${ENVIOPACK_API}/localidades?provincia=${provincia}&access_token=${token}`
    );

    if (!response.ok) {
      throw new Error(`Error al obtener localidades: ${response.status}`);
    }

    const localidades = await response.json();
    res.json({ exito: true, datos: localidades });
  } catch (error) {
    console.error('Error al obtener localidades:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener localidades.' });
  }
});

module.exports = router;
