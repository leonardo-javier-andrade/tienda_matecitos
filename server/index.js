const express = require('express');
const cors = require('cors');
require('dotenv').config();

const conectarDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a MongoDB
conectarDB();

// ─── Middlewares ────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// ─── Rutas ─────────────────────────────────────────────
app.use('/api/products', productRoutes);

// Ruta de estado / health check
app.get('/api/status', (_req, res) => {
  res.json({
    exito: true,
    mensaje: '🧉 API de Tienda Matecitos funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Ruta raíz
app.get('/', (_req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API de Tienda Matecitos',
    documentacion: '/api/status',
  });
});

// ─── Iniciar servidor ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`🧉 Servidor corriendo en puerto ${PORT}`);
});
