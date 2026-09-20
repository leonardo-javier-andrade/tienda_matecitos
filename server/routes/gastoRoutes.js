const express = require('express');
const router = express.Router();
const Gasto = require('../models/Gasto');
const { verificarAdmin } = require('../middleware/auth');

// GET /api/gastos — Listar gastos con filtros
router.get('/', verificarAdmin, async (req, res) => {
  try {
    const { categoria, desde, hasta, page = 1, limit = 30 } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = categoria;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta + 'T23:59:59.999Z');
    }

    const gastos = await Gasto.find(filtro)
      .sort({ fecha: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Gasto.countDocuments(filtro);

    res.json({
      exito: true,
      cantidad: gastos.length,
      total,
      paginas: Math.ceil(total / limit),
      datos: gastos,
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener gastos.' });
  }
});

// GET /api/gastos/resumen — Totales por categoría y período
router.get('/resumen', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const matchStage = {};

    if (desde || hasta) {
      matchStage.fecha = {};
      if (desde) matchStage.fecha.$gte = new Date(desde);
      if (hasta) matchStage.fecha.$lte = new Date(hasta + 'T23:59:59.999Z');
    }

    const porCategoria = await Gasto.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: '$monto' },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalGeneral = porCategoria.reduce((acc, cat) => acc + cat.total, 0);

    // Total del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const totalMes = await Gasto.aggregate([
      { $match: { fecha: { $gte: inicioMes } } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ]);

    res.json({
      exito: true,
      datos: {
        porCategoria,
        totalGeneral,
        totalMes: totalMes[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Error en resumen de gastos:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener resumen.' });
  }
});

// POST /api/gastos — Crear gasto
router.post('/', verificarAdmin, async (req, res) => {
  try {
    const gasto = new Gasto(req.body);
    await gasto.save();
    res.status(201).json({ exito: true, mensaje: 'Gasto registrado.', datos: gasto });
  } catch (error) {
    console.error('Error al crear gasto:', error.message);
    const mensaje = error.errors
      ? Object.values(error.errors).map((e) => e.message).join(', ')
      : 'Error al registrar el gasto.';
    res.status(400).json({ exito: false, mensaje });
  }
});

// PUT /api/gastos/:id — Editar gasto
router.put('/:id', verificarAdmin, async (req, res) => {
  try {
    const gasto = await Gasto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!gasto) {
      return res.status(404).json({ exito: false, mensaje: 'Gasto no encontrado.' });
    }
    res.json({ exito: true, mensaje: 'Gasto actualizado.', datos: gasto });
  } catch (error) {
    console.error('Error al actualizar gasto:', error.message);
    res.status(400).json({ exito: false, mensaje: 'Error al actualizar el gasto.' });
  }
});

// DELETE /api/gastos/:id — Eliminar gasto
router.delete('/:id', verificarAdmin, async (req, res) => {
  try {
    const gasto = await Gasto.findByIdAndDelete(req.params.id);
    if (!gasto) {
      return res.status(404).json({ exito: false, mensaje: 'Gasto no encontrado.' });
    }
    res.json({ exito: true, mensaje: 'Gasto eliminado.' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar el gasto.' });
  }
});

module.exports = router;
