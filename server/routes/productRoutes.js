const express = require('express');
const router = express.Router();
const Producto = require('../models/Product');
const { verificarAdmin } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// ─── RUTAS PÚBLICAS ────────────────────────────────────

// GET /api/products — Obtener todos los productos (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { categoria, destacado, promocionCentro, activo, buscar } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = categoria;
    if (destacado) filtro.destacado = destacado === 'true';
    if (promocionCentro) filtro.promocionCentro = promocionCentro === 'true';
    if (activo !== undefined) {
      filtro.activo = activo === 'true';
    } else {
      filtro.activo = true;
    }

    // Búsqueda por nombre
    if (buscar) {
      filtro.nombre = { $regex: buscar, $options: 'i' };
    }

    const productos = await Producto.find(filtro).sort({ createdAt: -1 });

    res.json({
      exito: true,
      cantidad: productos.length,
      datos: productos,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
});

// GET /api/products/:id — Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Producto no encontrado',
      });
    }

    res.json({
      exito: true,
      datos: producto,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de producto inválido',
      });
    }
    console.error('Error al obtener producto:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
});

// ─── RUTAS PROTEGIDAS (ADMIN) ──────────────────────────

// GET /api/products/admin/todos — Obtener TODOS los productos (activos e inactivos)
router.get('/admin/todos', verificarAdmin, async (req, res) => {
  try {
    const { categoria, buscar } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = categoria;
    if (buscar) filtro.nombre = { $regex: buscar, $options: 'i' };

    const productos = await Producto.find(filtro).sort({ createdAt: -1 });

    res.json({
      exito: true,
      cantidad: productos.length,
      datos: productos,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// POST /api/products — Crear un producto nuevo
router.post('/', verificarAdmin, async (req, res) => {
  try {
    const producto = new Producto(req.body);
    const productoGuardado = await producto.save();

    res.status(201).json({
      exito: true,
      mensaje: 'Producto creado exitosamente.',
      datos: productoGuardado,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación.',
        errores,
      });
    }
    console.error('Error al crear producto:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// PUT /api/products/:id — Actualizar un producto
router.put('/:id', verificarAdmin, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Producto no encontrado.',
      });
    }

    res.json({
      exito: true,
      mensaje: 'Producto actualizado exitosamente.',
      datos: producto,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación.',
        errores,
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido' });
    }
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// DELETE /api/products/:id — Eliminar un producto (y sus archivos de Cloudinary)
router.delete('/:id', verificarAdmin, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Producto no encontrado.',
      });
    }

    // Eliminar imágenes de Cloudinary
    for (const img of producto.imagenes) {
      try {
        await cloudinary.uploader.destroy(img.publicId, { resource_type: 'image' });
      } catch (e) {
        console.error(`Error eliminando imagen ${img.publicId}:`, e.message);
      }
    }

    // Eliminar videos de Cloudinary
    for (const vid of producto.videos) {
      try {
        await cloudinary.uploader.destroy(vid.publicId, { resource_type: 'video' });
      } catch (e) {
        console.error(`Error eliminando video ${vid.publicId}:`, e.message);
      }
    }

    // Eliminar imagen hero de Cloudinary
    if (producto.imagenHero && producto.imagenHero.publicId) {
      try {
        await cloudinary.uploader.destroy(producto.imagenHero.publicId, { resource_type: 'image' });
      } catch (e) {
        console.error(`Error eliminando imagen hero ${producto.imagenHero.publicId}:`, e.message);
      }
    }

    await Producto.findByIdAndDelete(req.params.id);

    res.json({
      exito: true,
      mensaje: 'Producto eliminado exitosamente.',
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido' });
    }
    console.error('Error al eliminar producto:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
