const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      unique: true,
      trim: true,
      maxlength: [50, 'El nombre no puede superar los 50 caracteres'],
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    fondoMedia: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      tipo: { type: String, enum: ['', 'imagen', 'video'], default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Categoria', categoriaSchema);
