const express = require('express');
const router = express.Router();
const Hero = require('../models/Hero');
const { verificarAdmin } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// ─── RUTAS PUBLICAS ────────────────────────────────────

// GET /api/hero — Obtener slides activos del hero (publico)
router.get('/', async (_req, res) => {
  try {
    const slides = await Hero.find({ activo: true }).sort({ orden: 1 });
    res.json({
      exito: true,
      cantidad: slides.length,
      datos: slides,
    });
  } catch (error) {
    console.error('Error al obtener slides del hero:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// ─── RUTAS PROTEGIDAS (ADMIN) ──────────────────────────

// GET /api/hero/admin/todos — Obtener TODOS los slides (activos e inactivos)
router.get('/admin/todos', verificarAdmin, async (_req, res) => {
  try {
    const slides = await Hero.find().sort({ orden: 1 });
    res.json({
      exito: true,
      cantidad: slides.length,
      datos: slides,
    });
  } catch (error) {
    console.error('Error al obtener slides:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// POST /api/hero — Crear un slide
router.post('/', verificarAdmin, async (req, res) => {
  try {
    const slide = new Hero(req.body);
    const guardado = await slide.save();
    res.status(201).json({
      exito: true,
      mensaje: 'Slide del hero creado exitosamente.',
      datos: guardado,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validacion.', errores });
    }
    console.error('Error al crear slide:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// PUT /api/hero/:id — Actualizar un slide
router.put('/:id', verificarAdmin, async (req, res) => {
  try {
    const slide = await Hero.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!slide) {
      return res.status(404).json({ exito: false, mensaje: 'Slide no encontrado.' });
    }

    res.json({
      exito: true,
      mensaje: 'Slide actualizado exitosamente.',
      datos: slide,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validacion.', errores });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID invalido' });
    }
    console.error('Error al actualizar slide:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// DELETE /api/hero/:id — Eliminar un slide (y su imagen de Cloudinary)
router.delete('/:id', verificarAdmin, async (req, res) => {
  try {
    const slide = await Hero.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({ exito: false, mensaje: 'Slide no encontrado.' });
    }

    // Eliminar imagen de Cloudinary
    if (slide.imagenFondo && slide.imagenFondo.publicId) {
      try {
        await cloudinary.uploader.destroy(slide.imagenFondo.publicId, { resource_type: 'image' });
      } catch (e) {
        console.error(`Error eliminando imagen ${slide.imagenFondo.publicId}:`, e.message);
      }
    }

    await Hero.findByIdAndDelete(req.params.id);

    res.json({
      exito: true,
      mensaje: 'Slide eliminado exitosamente.',
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID invalido' });
    }
    console.error('Error al eliminar slide:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
