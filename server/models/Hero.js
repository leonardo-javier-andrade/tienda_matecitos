const mongoose = require('mongoose');

const estiloTextoSchema = {
  fontSize: { type: String, trim: true, default: '' },
  color: { type: String, trim: true, default: '' },
  fontFamily: { type: String, trim: true, default: '' },
  fontWeight: { type: String, enum: ['', 'normal', 'bold'], default: '' },
};

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
    tipoMedia: {
      type: String,
      enum: ['imagen', 'video'],
      default: 'imagen',
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
    estiloTitulo: estiloTextoSchema,
    estiloDescripcion: estiloTextoSchema,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hero', heroSchema);
