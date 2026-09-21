const mongoose = require('mongoose');

const itemOrdenSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    imagen: { type: String, default: '' },
    costoUnitario: { type: Number, default: 0 },
  },
  { _id: false }
);

const ordenSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    items: {
      type: [itemOrdenSchema],
      required: true,
      validate: [(v) => v.length > 0, 'La orden debe tener al menos un item'],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    costoEnvio: {
      type: Number,
      default: 0,
    },
    envio: {
      servicio: { type: String, default: '' },
      correo: { type: String, default: '' },
      modalidad: { type: String, default: '' },
      horasEntrega: { type: Number, default: 0 },
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado', 'enviado', 'entregado', 'cancelado'],
      default: 'pendiente',
    },

    // ─── Origen y canal ─────────────────────────────────
    origen: {
      type: String,
      enum: ['web', 'manual'],
      default: 'web',
    },
    canal: {
      type: String,
      enum: ['online', 'whatsapp', 'presencial', 'otro'],
      default: 'online',
    },
    metodoPago: {
      type: String,
      enum: ['mercadopago', 'efectivo', 'transferencia', 'otro'],
      default: 'mercadopago',
    },

    // ─── Despacho y logistica ───────────────────────────
    estadoDespacho: {
      type: String,
      enum: ['pendiente', 'preparando', 'despachado', 'entregado'],
      default: 'pendiente',
    },
    logisticaPagada: {
      type: Boolean,
      default: false,
    },

    // ─── Desglose financiero ────────────────────────────
    subtotalProductos: {
      type: Number,
      default: 0,
    },
    envioCobradoAlCliente: {
      type: Number,
      default: 0,
    },
    comisionMPCalculada: {
      type: Number,
      default: 0,
    },
    ivaCalculado: {
      type: Number,
      default: 0,
    },
    totalPagadoCliente: {
      type: Number,
      default: 0,
    },
    costoTotalProductos: {
      type: Number,
      default: 0,
    },
    gananciaNetaEstimada: {
      type: Number,
      default: 0,
    },

    // ─── Campos legacy (compatibilidad) ─────────────────
    comisionMP: {
      type: Number,
      default: 0,
    },
    costoProductos: {
      type: Number,
      default: 0,
    },
    notasVenta: {
      type: String,
      default: '',
    },

    // ─── MercadoPago ────────────────────────────────────
    mpPreferenceId: {
      type: String,
      default: '',
    },
    mpPaymentId: {
      type: String,
      default: '',
    },
    mpStatus: {
      type: String,
      default: '',
    },
    mpStatusDetail: {
      type: String,
      default: '',
    },

    // ─── Datos de contacto/envio ────────────────────────
    datosEnvio: {
      nombre: { type: String, default: '' },
      telefono: { type: String, default: '' },
      direccion: { type: String, default: '' },
      ciudad: { type: String, default: '' },
      provincia: { type: String, default: '' },
      codigoPostal: { type: String, default: '' },
      notas: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Orden', ordenSchema);
