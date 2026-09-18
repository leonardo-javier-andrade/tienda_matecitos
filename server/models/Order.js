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
  },
  { _id: false }
);

const ordenSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
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
    // MercadoPago
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
    // Datos de contacto/envío
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
