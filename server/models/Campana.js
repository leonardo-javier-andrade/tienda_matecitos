const mongoose = require('mongoose');

const campanaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: 100,
    },
    tipo: {
      type: String,
      enum: ['temporada', 'promocion', 'evento', 'otro'],
      required: [true, 'El tipo es obligatorio'],
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria'],
    },
    fechaFin: {
      type: Date,
      required: [true, 'La fecha de fin es obligatoria'],
    },
    descripcion: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    presupuesto: {
      type: Number,
      default: 0,
      min: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campana', campanaSchema);
