const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El titulo es obligatorio'],
      trim: true,
      maxlength: [120, 'El titulo no puede superar los 120 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripcion no puede superar los 500 caracteres'],
      default: '',
    },
    imagenFondo: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    enlace: {
      type: String,
      trim: true,
      default: '',
    },
    textoBoton: {
      type: String,
      trim: true,
      default: 'Ver mas',
      maxlength: [50, 'El texto del boton no puede superar los 50 caracteres'],
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hero', heroSchema);
