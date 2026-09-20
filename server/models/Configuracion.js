const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema(
  {
    comisionMP: {
      type: Number,
      default: 5.99,
      min: 0,
      max: 100,
    },
    ivaComision: {
      type: Number,
      default: 21,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Singleton: siempre usar findOne() o getConfig()
configuracionSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('Configuracion', configuracionSchema);
