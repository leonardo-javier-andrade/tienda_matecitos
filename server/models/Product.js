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
      maxlength: [1000, 'La descripción no puede superar los 1000 caracteres'],
      default: '',
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
    imagenes: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true }, // ID de Cloudinary para borrar
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
      enum: {
        values: ['Mates', 'Bombillas', 'Termos', 'Yerberas', 'Kits', 'Accesorios'],
        message: '{VALUE} no es una categoría válida',
      },
      required: [true, 'La categoría es obligatoria'],
    },
    destacado: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('Producto', productoSchema);
