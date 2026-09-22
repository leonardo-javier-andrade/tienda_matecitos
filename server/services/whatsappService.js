// ─── WhatsApp Cloud API — Notificaciones al dueño ───
// Envía avisos al dueño/administradores cuando se realiza una compra
// o cuando el stock de un producto baja a niveles críticos.

const WHATSAPP_API_URL = 'https://graph.facebook.com/v25.0';

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
 * Obtener los números de notificación (soporta múltiples separados por coma)
 * WHATSAPP_TIENDA_NUMERO puede ser "5491124578724" o "5491124578724,5491178166636"
 */
const obtenerNumerosNotificacion = () => {
  const raw = process.env.WHATSAPP_TIENDA_NUMERO || '';
  return raw.split(',').map(n => n.trim()).filter(Boolean);
};

/**
 * Enviar un mensaje a todos los números de notificación configurados
 */
const notificarATodos = async (mensaje) => {
  const numeros = obtenerNumerosNotificacion();
  if (numeros.length === 0) {
    console.warn('WHATSAPP_TIENDA_NUMERO no configurado');
    return;
  }
  const resultados = await Promise.allSettled(
    numeros.map(num => enviarMensajeWhatsApp(num, mensaje))
  );
  return resultados;
};

/**
 * Formatear precio en ARS
 */
const formatPrecio = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

/**
 * Enviar notificación de nueva compra a los administradores
 */
const notificarCompraPorWhatsApp = async (orden, usuario) => {
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

  return notificarATodos(mensaje);
};

/**
 * Notificar stock crítico de un producto
 * Se llama cuando el stock baja de un umbral (ej: 3 unidades)
 */
const notificarStockCritico = async (producto, stockActual) => {
  const mensaje =
    `⚠️ *STOCK CRÍTICO — Matecitos*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📦 *Producto:* ${producto.nombre}\n` +
    `🔢 *Stock actual:* ${stockActual} unidades\n` +
    `💰 Precio: ${formatPrecio(producto.precio)}\n\n` +
    `🔄 Revisá el inventario y reponé antes de quedarte sin stock.`;

  return notificarATodos(mensaje);
};

module.exports = {
  enviarMensajeWhatsApp,
  notificarCompraPorWhatsApp,
  notificarStockCritico,
};
