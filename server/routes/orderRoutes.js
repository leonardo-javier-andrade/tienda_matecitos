const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const Orden = require('../models/Order');
const Producto = require('../models/Product');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// ─── Configurar MercadoPago ────────────────────────────
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ─── RUTAS DEL USUARIO ─────────────────────────────────

// POST /api/orders/checkout — Crear orden + preferencia de MercadoPago
router.post('/checkout', verificarToken, async (req, res) => {
  try {
    const { items, datosEnvio, envio } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'El carrito está vacío.' });
    }

    // Verificar stock y obtener precios reales de la DB
    const itemsVerificados = [];
    let total = 0;

    for (const item of items) {
      const producto = await Producto.findById(item.productoId);

      if (!producto || !producto.activo) {
        return res.status(400).json({
          exito: false,
          mensaje: `El producto "${item.nombre || 'desconocido'}" ya no está disponible.`,
        });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          exito: false,
          mensaje: `Stock insuficiente de "${producto.nombre}". Disponible: ${producto.stock}.`,
        });
      }

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      itemsVerificados.push({
        producto: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        imagen: producto.imagenes?.[0]?.url || '',
      });
    }

    // Calcular total con envío
    const costoEnvio = envio?.costo || 0;
    const totalConEnvio = total + costoEnvio;

    // Crear la orden en estado pendiente
    const orden = new Orden({
      usuario: req.usuario._id,
      items: itemsVerificados,
      total: totalConEnvio,
      costoEnvio,
      envio: {
        servicio: envio?.servicio || '',
        correo: envio?.correo || '',
        modalidad: envio?.modalidad || '',
        horasEntrega: envio?.horasEntrega || 0,
      },
      estado: 'pendiente',
      datosEnvio: datosEnvio || {},
    });
    await orden.save();

    // Crear preferencia de MercadoPago
    const preference = new Preference(mpClient);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const preferenceData = await preference.create({
      body: {
        items: itemsVerificados.map((item) => ({
          id: item.producto.toString(),
          title: item.nombre,
          quantity: Number(item.cantidad),
          unit_price: Number(parseFloat(item.precio).toFixed(2)),
          currency_id: 'ARS',
          ...(item.imagen ? { picture_url: item.imagen } : {}),
        })),
        payer: {
          name: req.usuario.nombre,
          email: req.usuario.email,
        },
        back_urls: {
          success: `${clientUrl}/orden/resultado?status=approved`,
          failure: `${clientUrl}/orden/resultado?status=rejected`,
          pending: `${clientUrl}/orden/resultado?status=pending`,
        },
        auto_return: 'approved',
        ...(costoEnvio > 0 && {
          shipments: {
            cost: costoEnvio,
            mode: 'not_specified',
          },
        }),
        external_reference: orden._id.toString(),
        notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/orders/webhook`,
        statement_descriptor: 'MATECITOS',
      },
    });

    // Guardar el ID de preferencia en la orden
    orden.mpPreferenceId = preferenceData.id;
    await orden.save();

    res.json({
      exito: true,
      mensaje: 'Preferencia de pago creada.',
      datos: {
        ordenId: orden._id,
        initPoint: preferenceData.init_point,
        sandboxInitPoint: preferenceData.sandbox_init_point,
      },
    });
  } catch (error) {
    // Log detallado del error de MercadoPago
    console.error('=== ERROR CHECKOUT ===');
    console.error('Mensaje:', error.message);
    console.error('Status:', error.status || error.statusCode || 'N/A');
    console.error('Cause:', JSON.stringify(error.cause || 'N/A'));
    console.error('Response:', JSON.stringify(error.response || 'N/A'));
    console.error('Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('=== FIN ERROR ===');

    const mensajeError = error.cause?.[0]?.description
      || error.message
      || 'Error al procesar el checkout.';

    res.status(500).json({
      exito: false,
      mensaje: mensajeError,
      // En desarrollo, enviar más detalle
      detalle: process.env.NODE_ENV !== 'production' ? {
        mpStatus: error.status,
        mpCause: error.cause,
        message: error.message,
      } : undefined,
    });
  }
});

// GET /api/orders/mis-ordenes — Obtener órdenes del usuario
router.get('/mis-ordenes', verificarToken, async (req, res) => {
  try {
    const ordenes = await Orden.find({ usuario: req.usuario._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      exito: true,
      cantidad: ordenes.length,
      datos: ordenes,
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
});

// GET /api/orders/:id — Obtener detalle de una orden
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id);

    if (!orden) {
      return res.status(404).json({ exito: false, mensaje: 'Orden no encontrada.' });
    }

    // Solo el dueño o un admin pueden ver la orden
    if (orden.usuario.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
      return res.status(403).json({ exito: false, mensaje: 'No autorizado.' });
    }

    res.json({ exito: true, datos: orden });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido.' });
    }
    console.error('Error al obtener orden:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
});

// ─── WEBHOOK DE MERCADOPAGO ────────────────────────────

// POST /api/orders/webhook — Recibir notificaciones de MercadoPago
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    // Solo procesamos notificaciones de pago
    if (type === 'payment') {
      const payment = new Payment(mpClient);
      const paymentData = await payment.get({ id: data.id });

      if (paymentData) {
        const ordenId = paymentData.external_reference;
        const orden = await Orden.findById(ordenId);

        if (orden) {
          orden.mpPaymentId = paymentData.id.toString();
          orden.mpStatus = paymentData.status;
          orden.mpStatusDetail = paymentData.status_detail || '';

          // Actualizar estado de la orden según MercadoPago
          switch (paymentData.status) {
            case 'approved':
              orden.estado = 'aprobado';
              // Descontar stock
              for (const item of orden.items) {
                await Producto.findByIdAndUpdate(item.producto, {
                  $inc: { stock: -item.cantidad },
                });
              }
              break;
            case 'rejected':
              orden.estado = 'rechazado';
              break;
            case 'in_process':
            case 'pending':
              orden.estado = 'pendiente';
              break;
            case 'cancelled':
              orden.estado = 'cancelado';
              break;
            default:
              break;
          }

          await orden.save();
          console.log(`Orden ${ordenId} actualizada: ${paymentData.status}`);
        }
      }
    }

    // MercadoPago espera 200 OK
    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook MP:', error.message);
    // Siempre responder 200 para que MP no reintente infinitamente
    res.sendStatus(200);
  }
});


// GET /api/orders/test-mp — Verificar conexión con MercadoPago (admin)
router.get('/test-mp', verificarAdmin, async (req, res) => {
  try {
    const preference = new Preference(mpClient);

    const testPref = await preference.create({
      body: {
        items: [{
          id: 'test-item',
          title: 'Test de conexión',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        }],
        back_urls: {
          success: `${process.env.CLIENT_URL || 'http://localhost:5173'}/orden/resultado?status=approved`,
          failure: `${process.env.CLIENT_URL || 'http://localhost:5173'}/orden/resultado?status=rejected`,
          pending: `${process.env.CLIENT_URL || 'http://localhost:5173'}/orden/resultado?status=pending`,
        },
        external_reference: 'test-connection',
      },
    });

    res.json({
      exito: true,
      mensaje: 'Conexión con MercadoPago OK',
      datos: {
        preferenceId: testPref.id,
        initPoint: testPref.init_point,
        sandboxInitPoint: testPref.sandbox_init_point,
        tokenPrefix: process.env.MP_ACCESS_TOKEN?.substring(0, 15) + '...',
      },
    });
  } catch (error) {
    console.error('Test MP error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({
      exito: false,
      mensaje: 'Error al conectar con MercadoPago',
      detalle: {
        message: error.message,
        status: error.status,
        cause: error.cause,
      },
    });
  }
});

// ─── RUTAS ADMIN ───────────────────────────────────────

// GET /api/orders/admin/todas — Todas las órdenes (admin)
router.get('/admin/todas', verificarAdmin, async (req, res) => {
  try {
    const { estado, page = 1, limit = 20 } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;

    const ordenes = await Orden.find(filtro)
      .populate('usuario', 'nombre email telefono')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Orden.countDocuments(filtro);

    res.json({
      exito: true,
      cantidad: ordenes.length,
      total,
      paginas: Math.ceil(total / limit),
      datos: ordenes,
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
});

// PUT /api/orders/admin/:id/estado — Cambiar estado de orden (admin)
router.put('/admin/:id/estado', verificarAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'enviado', 'entregado', 'cancelado'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado no válido.' });
    }

    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!orden) {
      return res.status(404).json({ exito: false, mensaje: 'Orden no encontrada.' });
    }

    res.json({
      exito: true,
      mensaje: `Estado actualizado a "${estado}".`,
      datos: orden,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido.' });
    }
    console.error('Error al actualizar estado:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
});

module.exports = router;
