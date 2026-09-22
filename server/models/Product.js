const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      maxlength: [120, 'El nombre no puede superar los 120 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripcion no puede superar los 1000 caracteres'],
      default: '',
    },
    sku: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    costoUnitario: {
      type: Number,
      default: 0,
      min: [0, 'El costo no puede ser negativo'],
    },
    gastoEnvio: {
      type: Number,
      default: 0,
      min: [0, 'El gasto de envio no puede ser negativo'],
    },
    porcentajeMargen: {
      type: Number,
      default: 40,
      min: [0, 'El margen no puede ser negativo'],
    },
    tipoProducto: {
      type: String,
      trim: true,
      default: '',
    },
    fechaIngreso: {
      type: Date,
      default: Date.now,
    },
    stockCritico: {
      type: Number,
      default: 3,
      min: 0,
    },
    imagenes: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    videos: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    categoria: {
      type: String,
      required: [true, 'La categoria es obligatoria'],
      trim: true,
    },
    destacado: {
      type: Boolean,
      default: false,
    },
    promocionCentro: {
      type: Boolean,
      default: false,
    },
    imagenHero: {
      url: { type: String },
      publicId: { type: String },
    },
    visitas: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    historialPrecios: [
      {
        fecha: { type: Date, default: Date.now },
        costoUnitario: { type: Number, default: 0 },
        gastoEnvio: { type: Number, default: 0 },
        porcentajeMargen: { type: Number, default: 40 },
        precioSugerido: { type: Number, default: 0 },
        precioVenta: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual: costo total (costo + envio)
productoSchema.virtual('costoTotal').get(function () {
  return this.costoUnitario + this.gastoEnvio;
});

// Virtual: precio sugerido basado en margen
productoSchema.virtual('precioSugerido').get(function () {
  const costoTotal = this.costoUnitario + this.gastoEnvio;
  const calculado = costoTotal * (1 + this.porcentajeMargen / 100);
  return Math.round(calculado / 100) * 100;
});

productoSchema.set('toJSON', { virtuals: true });
productoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Producto', productoSchema);
