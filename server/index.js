const express = require('express');
const cors = require('cors');
require('dotenv').config();

const conectarDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const heroRoutes = require('./routes/heroRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const Categoria = require('./models/Category');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 10000;

// Conectar a MongoDB
conectarDB();

// ─── Seed de categorias por defecto ───────────────────
const seedCategorias = async () => {
  try {
    const count = await Categoria.countDocuments();
    if (count === 0) {
      const defaults = [
        { nombre: 'Mates', orden: 1 },
        { nombre: 'Bombillas', orden: 2 },
        { nombre: 'Termos', orden: 3 },
        { nombre: 'Yerberas', orden: 4 },
        { nombre: 'Kits', orden: 5 },
        { nombre: 'Accesorios', orden: 6 },
      ];
      await Categoria.insertMany(defaults);
      console.log('Categorias por defecto creadas');
    }
  } catch (error) {
    console.error('Error al crear categorias por defecto:', error.message);
  }
};
seedCategorias();

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
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Ruta de estado / health check
app.get('/api/status', (_req, res) => {
  res.json({
    exito: true,
    mensaje: 'API de Tienda Matecitos funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Ruta raiz
app.get('/', (_req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API de Tienda Matecitos',
    documentacion: '/api/status',
  });
});

// ─── Manejo de errores de Multer ───────────────────────
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      exito: false,
      mensaje: 'El archivo supera el tamano maximo permitido (50 MB).',
    });
  }
  if (err.message && err.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      exito: false,
      mensaje: err.message,
    });
  }
  console.error('Error no manejado:', err);
  res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
});

// ─── Iniciar servidor ──────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
