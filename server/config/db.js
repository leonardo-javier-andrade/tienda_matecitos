const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    const conexion = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB conectado: ${conexion.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = conectarDB;
