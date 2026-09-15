const express = require('express');
const router = express.Router();
const Producto = require('../models/Product');

// GET /api/products — Obtener todos los productos (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { categoria, destacado, activo } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = categoria;
    if (destacado) filtro.destacado = destacado === 'true';
    if (activo !== undefined) {
      filtro.activo = activo === 'true';
    } else {
      filtro.activo = true; // por defecto solo mostrar productos activos
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
    // Manejar ID con formato inválido
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

module.exports = router;
