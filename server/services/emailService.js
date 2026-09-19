const { Resend } = require('resend');
const Orden = require('../models/Order');
const Producto = require('../models/Product');

const TIENDA_EMAIL = 'tiendamatecitos@gmail.com';

// Crear cliente de Resend
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// ─── Formatear precio en ARS ───
const formatPrecio = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

// ─── Notificación de nueva compra ───
const enviarNotificacionCompra = async (orden, usuario) => {
  try {
    const resend = getResend();

    const itemsHTML = orden.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.nombre}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.cantidad}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatPrecio(item.precio)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatPrecio(item.precio * item.cantidad)}</td>
          </tr>`
      )
      .join('');

    const envioInfo = orden.datosEnvio?.nombre
      ? `<h3 style="color:#6b4226;margin-top:20px;">Datos de envio</h3>
         <p><strong>Nombre:</strong> ${orden.datosEnvio.nombre}</p>
         <p><strong>Telefono:</strong> ${orden.datosEnvio.telefono || '-'}</p>
         <p><strong>Direccion:</strong> ${orden.datosEnvio.direccion || '-'}, ${orden.datosEnvio.ciudad || ''}, ${orden.datosEnvio.provincia || ''}</p>
         <p><strong>CP:</strong> ${orden.datosEnvio.codigoPostal || '-'}</p>
         ${orden.datosEnvio.notas ? `<p><strong>Notas:</strong> ${orden.datosEnvio.notas}</p>` : ''}`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8ddd0;">
        <div style="background:#6b4226;padding:20px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Nueva venta en Matecitos</h1>
        </div>
        <div style="padding:24px;">
          <p style="color:#555;">Se ha registrado una nueva compra:</p>
          <div style="background:#faf5ef;border-radius:8px;padding:16px;margin:16px 0;">
            <p><strong>Orden:</strong> #${orden._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>Cliente:</strong> ${usuario?.nombre || orden.datosEnvio?.nombre || 'N/A'}</p>
            <p><strong>Email:</strong> ${usuario?.email || 'N/A'}</p>
            <p><strong>Estado MP:</strong> ${orden.mpStatus || orden.estado}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f5ebe0;">
                <th style="padding:10px;text-align:left;">Producto</th>
                <th style="padding:10px;text-align:center;">Cant.</th>
                <th style="padding:10px;text-align:right;">Precio</th>
                <th style="padding:10px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          ${orden.costoEnvio > 0 ? `<p style="text-align:right;color:#888;">Envio: ${formatPrecio(orden.costoEnvio)}</p>` : ''}
          <p style="text-align:right;font-size:18px;font-weight:bold;color:#6b4226;">
            Total: ${formatPrecio(orden.total)}
          </p>
          ${envioInfo}
        </div>
        <div style="background:#f5ebe0;padding:12px;text-align:center;font-size:12px;color:#999;">
          Tienda Matecitos — Notificacion automatica
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: 'Tienda Matecitos <onboarding@resend.dev>',
      to: [TIENDA_EMAIL],
      subject: `Nueva venta #${orden._id.toString().slice(-8).toUpperCase()} - ${formatPrecio(orden.total)}`,
      html,
    });

    if (result.error) {
      console.error('Error de Resend (compra):', JSON.stringify(result.error));
    } else {
      console.log(`Email de compra enviado para orden ${orden._id}, ID: ${result.data?.id}`);
    }
  } catch (error) {
    console.error('Error al enviar email de compra:', error.message);
  }
};

// ─── Informe de ventas ───
const enviarInformeVentas = async () => {
  console.log('Iniciando envio de informe de ventas...');
  console.log('RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY);
  const resend = getResend();

  // Productos más vendidos
  const masVendidos = await Orden.aggregate([
    { $match: { estado: { $in: ['aprobado', 'enviado', 'entregado'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.producto',
        nombre: { $first: '$items.nombre' },
        cantidadVendida: { $sum: '$items.cantidad' },
        ingresoTotal: { $sum: { $multiply: ['$items.precio', '$items.cantidad'] } },
      },
    },
    { $sort: { cantidadVendida: -1 } },
    { $limit: 10 },
  ]);

  // Productos más visitados
  const masVisitados = await Producto.find({ activo: true })
    .sort({ visitas: -1 })
    .limit(10)
    .select('nombre visitas precio');

  // Productos menos vendidos
  const productos = await Producto.find({ activo: true }).select('nombre precio stock');
  const ventas = await Orden.aggregate([
    { $match: { estado: { $in: ['aprobado', 'enviado', 'entregado'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.producto', cantidadVendida: { $sum: '$items.cantidad' } } },
  ]);
  const ventasMap = {};
  ventas.forEach((v) => { ventasMap[v._id.toString()] = v.cantidadVendida; });
  const menosVendidos = productos
    .map((p) => ({ nombre: p.nombre, precio: p.precio, stock: p.stock, vendidos: ventasMap[p._id.toString()] || 0 }))
    .sort((a, b) => a.vendidos - b.vendidos)
    .slice(0, 10);

  // Ingresos
  const ingresosTotales = await Orden.aggregate([
    { $match: { estado: { $in: ['aprobado', 'enviado', 'entregado'] } } },
    { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
  ]);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const ingresosMes = await Orden.aggregate([
    { $match: { estado: { $in: ['aprobado', 'enviado', 'entregado'] }, createdAt: { $gte: inicioMes } } },
    { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
  ]);

  const filasVendidos = masVendidos
    .map((p, i) => `<tr><td style="padding:6px 10px;">${i + 1}</td><td style="padding:6px 10px;">${p.nombre}</td><td style="padding:6px 10px;text-align:center;">${p.cantidadVendida}</td><td style="padding:6px 10px;text-align:right;">${formatPrecio(p.ingresoTotal)}</td></tr>`)
    .join('');

  const filasVisitados = masVisitados
    .map((p, i) => `<tr><td style="padding:6px 10px;">${i + 1}</td><td style="padding:6px 10px;">${p.nombre}</td><td style="padding:6px 10px;text-align:center;">${p.visitas || 0}</td></tr>`)
    .join('');

  const filasMenosVendidos = menosVendidos
    .map((p, i) => `<tr><td style="padding:6px 10px;">${i + 1}</td><td style="padding:6px 10px;">${p.nombre}</td><td style="padding:6px 10px;text-align:center;">${p.vendidos}</td><td style="padding:6px 10px;text-align:center;">${p.stock}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8ddd0;">
      <div style="background:#6b4226;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Informe de Ventas — Matecitos</h1>
        <p style="color:#d4b896;margin:6px 0 0;font-size:14px;">${new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:16px;background:#faf5ef;border-radius:10px;text-align:center;width:33%;">
              <div style="font-size:24px;font-weight:bold;color:#6b4226;">${formatPrecio(ingresosTotales[0]?.total || 0)}</div>
              <div style="font-size:12px;color:#999;margin-top:4px;">Ingresos totales</div>
            </td>
            <td style="width:12px;"></td>
            <td style="padding:16px;background:#faf5ef;border-radius:10px;text-align:center;width:33%;">
              <div style="font-size:24px;font-weight:bold;color:#6b4226;">${formatPrecio(ingresosMes[0]?.total || 0)}</div>
              <div style="font-size:12px;color:#999;margin-top:4px;">Ingresos del mes</div>
            </td>
            <td style="width:12px;"></td>
            <td style="padding:16px;background:#faf5ef;border-radius:10px;text-align:center;width:33%;">
              <div style="font-size:24px;font-weight:bold;color:#6b4226;">${ingresosTotales[0]?.cantidad || 0}</div>
              <div style="font-size:12px;color:#999;margin-top:4px;">Ventas totales</div>
            </td>
          </tr>
        </table>

        <h2 style="color:#6b4226;font-size:18px;border-bottom:2px solid #e8ddd0;padding-bottom:8px;">Productos mas vendidos</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#f5ebe0;"><th style="padding:8px 10px;text-align:left;">#</th><th style="padding:8px 10px;text-align:left;">Producto</th><th style="padding:8px 10px;text-align:center;">Vendidos</th><th style="padding:8px 10px;text-align:right;">Ingreso</th></tr></thead>
          <tbody>${filasVendidos || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#999;">Sin datos todavia</td></tr>'}</tbody>
        </table>

        <h2 style="color:#6b4226;font-size:18px;border-bottom:2px solid #e8ddd0;padding-bottom:8px;">Productos mas visitados</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#f5ebe0;"><th style="padding:8px 10px;text-align:left;">#</th><th style="padding:8px 10px;text-align:left;">Producto</th><th style="padding:8px 10px;text-align:center;">Visitas</th></tr></thead>
          <tbody>${filasVisitados || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#999;">Sin datos todavia</td></tr>'}</tbody>
        </table>

        <h2 style="color:#6b4226;font-size:18px;border-bottom:2px solid #e8ddd0;padding-bottom:8px;">Productos menos vendidos</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#f5ebe0;"><th style="padding:8px 10px;text-align:left;">#</th><th style="padding:8px 10px;text-align:left;">Producto</th><th style="padding:8px 10px;text-align:center;">Vendidos</th><th style="padding:8px 10px;text-align:center;">Stock</th></tr></thead>
          <tbody>${filasMenosVendidos || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#999;">Sin datos todavia</td></tr>'}</tbody>
        </table>
      </div>
      <div style="background:#f5ebe0;padding:12px;text-align:center;font-size:12px;color:#999;">
        Tienda Matecitos — Informe automatico
      </div>
    </div>
  `;

  console.log('Enviando informe a:', TIENDA_EMAIL);
  const result = await resend.emails.send({
    from: 'Tienda Matecitos <onboarding@resend.dev>',
    to: [TIENDA_EMAIL],
    subject: `Informe de ventas — ${new Date().toLocaleDateString('es-AR')}`,
    html,
  });

  if (result.error) {
    console.error('Error de Resend:', JSON.stringify(result.error));
    throw new Error(result.error.message || 'Error de Resend: ' + JSON.stringify(result.error));
  }

  console.log('Informe de ventas enviado, ID:', result.data?.id);
};

module.exports = { enviarNotificacionCompra, enviarInformeVentas };
