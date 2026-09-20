// ─── WhatsApp Cloud API — Notificaciones de compra ───
// Envía un mensaje al número de la tienda cuando se realiza una compra

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Enviar mensaje de WhatsApp usando la Cloud API de Meta
 */
const enviarMensajeWhatsApp = async (telefono, mensaje) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp no configurado: faltan WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN');
    return null;
  }

  // Formatear número: quitar espacios, guiones, y asegurar código de país
  let numeroLimpio = telefono.replace(/[\s\-()]/g, '');
  if (numeroLimpio.startsWith('0')) {
    numeroLimpio = '54' + numeroLimpio.substring(1); // Argentina
  }
  if (!numeroLimpio.startsWith('+') && !numeroLimpio.startsWith('54')) {
    numeroLimpio = '54' + numeroLimpio;
  }
  numeroLimpio = numeroLimpio.replace('+', '');

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numeroLimpio,
        type: 'text',
        text: { body: mensaje },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error WhatsApp API:', JSON.stringify(data));
      return null;
    }

    console.log('WhatsApp enviado a', numeroLimpio, '- ID:', data.messages?.[0]?.id);
    return data;
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error.message);
    return null;
  }
};

/**
 * Formatear precio en ARS
 */
const formatPrecio = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

/**
 * Enviar notificación de nueva compra al número de la tienda
 */
const notificarCompraPorWhatsApp = async (orden, usuario) => {
  const telefonoTienda = process.env.WHATSAPP_TIENDA_NUMERO;

  if (!telefonoTienda) {
    console.warn('WHATSAPP_TIENDA_NUMERO no configurado');
    return;
  }

  // Armar lista de productos
  const listaItems = orden.items
    .map((item) => `  • ${item.nombre} x${item.cantidad} — ${formatPrecio(item.precio * item.cantidad)}`)
    .join('\n');

  // Datos del cliente
  const nombreCliente = usuario?.nombre || orden.datosEnvio?.nombre || 'N/A';
  const emailCliente = usuario?.email || 'N/A';
  const telCliente = usuario?.telefono || orden.datosEnvio?.telefono || 'N/A';

  // Datos de envío
  let envioTexto = '';
  if (orden.datosEnvio) {
    const d = orden.datosEnvio;
    const partes = [d.direccion, d.ciudad, d.provincia, d.codigoPostal].filter(Boolean);
    if (partes.length > 0) {
      envioTexto = `\n📦 *Enviar a:*\n  ${d.nombre || nombreCliente}\n  ${partes.join(', ')}`;
      if (d.notas) envioTexto += `\n  Notas: ${d.notas}`;
    }
  }

  const mensaje =
    `🧉 *NUEVA VENTA — Matecitos*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🛒 *Orden:* #${orden._id.toString().slice(-8).toUpperCase()}\n\n` +
    `👤 *Cliente:* ${nombreCliente}\n` +
    `📧 Email: ${emailCliente}\n` +
    `📱 Tel: ${telCliente}\n\n` +
    `📋 *Productos:*\n${listaItems}\n\n` +
    (orden.costoEnvio > 0 ? `🚚 Envío: ${formatPrecio(orden.costoEnvio)}\n` : '') +
    `💰 *TOTAL: ${formatPrecio(orden.total)}*` +
    envioTexto +
    `\n\n✅ Pago aprobado por MercadoPago`;

  return enviarMensajeWhatsApp(telefonoTienda, mensaje);
};

module.exports = { enviarMensajeWhatsApp, notificarCompraPorWhatsApp };
