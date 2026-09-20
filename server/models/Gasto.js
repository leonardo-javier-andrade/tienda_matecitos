const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema(
  {
    descripcion: {
      type: String,
      required: [true, 'La descripcion es obligatoria'],
      trim: true,
      maxlength: 200,
    },
    monto: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0, 'El monto no puede ser negativo'],
    },
    categoria: {
      type: String,
      enum: ['envio', 'hosting', 'packaging', 'combustible', 'marketing', 'materia_prima', 'comision_mp', 'otro'],
      required: [true, 'La categoria es obligatoria'],
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    recurrente: {
      type: Boolean,
      default: false,
    },
    frecuencia: {
      type: String,
      enum: ['mensual', 'semanal', 'anual', null],
      default: null,
    },
    notas: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    ordenRelacionada: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orden',
      default: null,
    },
  },
  { timestamps: true }
);

// Index para consultas frecuentes
gastoSchema.index({ fecha: -1 });
gastoSchema.index({ categoria: 1, fecha: -1 });

module.exports = mongoose.model('Gasto', gastoSchema);
