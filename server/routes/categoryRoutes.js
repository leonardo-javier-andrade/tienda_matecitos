const express = require('express');
const router = express.Router();
const Categoria = require('../models/Category');
const { verificarAdmin } = require('../middleware/auth');

// ─── RUTAS PÚBLICAS ────────────────────────────────────

// GET /api/categories — Obtener categorías activas (público)
router.get('/', async (_req, res) => {
  try {
    const categorias = await Categoria.find({ activo: true }).sort({ orden: 1, nombre: 1 });
    res.json({
      exito: true,
      cantidad: categorias.length,
      datos: categorias,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// ─── RUTAS PROTEGIDAS (ADMIN) ──────────────────────────

// GET /api/categories/admin/todas — Obtener TODAS las categorías (activas e inactivas)
router.get('/admin/todas', verificarAdmin, async (_req, res) => {
  try {
    const categorias = await Categoria.find().sort({ orden: 1, nombre: 1 });
    res.json({
      exito: true,
      cantidad: categorias.length,
      datos: categorias,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// POST /api/categories — Crear una categoría
router.post('/', verificarAdmin, async (req, res) => {
  try {
    const categoria = new Categoria(req.body);
    const guardada = await categoria.save();
    res.status(201).json({
      exito: true,
      mensaje: 'Categoría creada exitosamente.',
      datos: guardada,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación.', errores });
    }
    if (error.code === 11000) {
      return res.status(400).json({ exito: false, mensaje: 'Ya existe una categoría con ese nombre.' });
    }
    console.error('Error al crear categoría:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// PUT /api/categories/:id — Actualizar una categoría
router.put('/:id', verificarAdmin, async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!categoria) {
      return res.status(404).json({ exito: false, mensaje: 'Categoría no encontrada.' });
    }

    res.json({
      exito: true,
      mensaje: 'Categoría actualizada exitosamente.',
      datos: categoria,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación.', errores });
    }
    if (error.code === 11000) {
      return res.status(400).json({ exito: false, mensaje: 'Ya existe una categoría con ese nombre.' });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido' });
    }
    console.error('Error al actualizar categoría:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// DELETE /api/categories/:id — Eliminar una categoría
router.delete('/:id', verificarAdmin, async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({ exito: false, mensaje: 'Categoría no encontrada.' });
    }

    await Categoria.findByIdAndDelete(req.params.id);

    res.json({
      exito: true,
      mensaje: `Categoría "${categoria.nombre}" eliminada exitosamente.`,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido' });
    }
    console.error('Error al eliminar categoría:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
