const express = require('express');
const router = express.Router();
const Campana = require('../models/Campana');
const Orden = require('../models/Order');
const Gasto = require('../models/Gasto');
const { verificarAdmin } = require('../middleware/auth');

// ─── GET /api/campanas ─────────────────────────────────
router.get('/', verificarAdmin, async (req, res) => {
  try {
    const { tipo, activo } = req.query;
    const filtro = {};
    if (tipo) filtro.tipo = tipo;
    if (activo !== undefined) filtro.activo = activo === 'true';

    const campanas = await Campana.find(filtro).sort({ fechaInicio: -1 });

    res.json({ exito: true, cantidad: campanas.length, datos: campanas });
  } catch (error) {
    console.error('Error al listar campañas:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno.' });
  }
});

// ─── GET /api/campanas/:id ─────────────────────────────
router.get('/:id', verificarAdmin, async (req, res) => {
  try {
    const campana = await Campana.findById(req.params.id);
    if (!campana) {
      return res.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }
    res.json({ exito: true, datos: campana });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido.' });
    }
    res.status(500).json({ exito: false, mensaje: 'Error interno.' });
  }
});

// ─── POST /api/campanas ────────────────────────────────
router.post('/', verificarAdmin, async (req, res) => {
  try {
    const { nombre, tipo, fechaInicio, fechaFin, descripcion, presupuesto } = req.body;

    if (!nombre || !tipo || !fechaInicio || !fechaFin) {
      return res.status(400).json({ exito: false, mensaje: 'Nombre, tipo, fecha inicio y fecha fin son obligatorios.' });
    }

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      return res.status(400).json({ exito: false, mensaje: 'La fecha de fin debe ser posterior a la de inicio.' });
    }

    const campana = new Campana({ nombre, tipo, fechaInicio, fechaFin, descripcion, presupuesto });
    await campana.save();

    res.status(201).json({ exito: true, mensaje: 'Campaña creada.', datos: campana });
  } catch (error) {
    console.error('Error al crear campaña:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al crear campaña.' });
  }
});

// ─── PUT /api/campanas/:id ─────────────────────────────
router.put('/:id', verificarAdmin, async (req, res) => {
  try {
    const campos = {};
    ['nombre', 'tipo', 'fechaInicio', 'fechaFin', 'descripcion', 'presupuesto', 'activo'].forEach((k) => {
      if (req.body[k] !== undefined) campos[k] = req.body[k];
    });

    if (campos.fechaFin && campos.fechaInicio && new Date(campos.fechaFin) <= new Date(campos.fechaInicio)) {
      return res.status(400).json({ exito: false, mensaje: 'La fecha de fin debe ser posterior a la de inicio.' });
    }

    const campana = await Campana.findByIdAndUpdate(req.params.id, campos, { new: true, runValidators: true });

    if (!campana) {
      return res.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }

    res.json({ exito: true, mensaje: 'Campaña actualizada.', datos: campana });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido.' });
    }
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar campaña.' });
  }
});

// ─── DELETE /api/campanas/:id ──────────────────────────
router.delete('/:id', verificarAdmin, async (req, res) => {
  try {
    const campana = await Campana.findByIdAndDelete(req.params.id);
    if (!campana) {
      return res.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }
    res.json({ exito: true, mensaje: 'Campaña eliminada.' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido.' });
    }
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar campaña.' });
  }
});

// ─── GET /api/campanas/:id/resultados ──────────────────
// Ventas, ingresos, gastos, ganancia y ROI dentro del rango de la campaña
router.get('/:id/resultados', verificarAdmin, async (req, res) => {
  try {
    const campana = await Campana.findById(req.params.id);
    if (!campana) {
      return res.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }

    const estadosValidos = ['aprobado', 'enviado', 'entregado'];

    // Ventas en el período de la campaña
    const ventas = await Orden.aggregate([
      {
        $match: {
          estado: { $in: estadosValidos },
          createdAt: { $gte: campana.fechaInicio, $lte: campana.fechaFin },
        },
      },
      {
        $group: {
          _id: null,
          ingresoTotal: { $sum: '$total' },
          costoProductos: { $sum: '$costoProductos' },
          comisionesMP: { $sum: '$comisionMP' },
          cantidadVentas: { $sum: 1 },
          ticketPromedio: { $avg: '$total' },
        },
      },
    ]);

    // Gastos en el período
    const gastos = await Gasto.aggregate([
      {
        $match: {
          fecha: { $gte: campana.fechaInicio, $lte: campana.fechaFin },
        },
      },
      {
        $group: {
          _id: null,
          totalGastos: { $sum: '$monto' },
        },
      },
    ]);

    const datosVentas = ventas[0] || { ingresoTotal: 0, costoProductos: 0, comisionesMP: 0, cantidadVentas: 0, ticketPromedio: 0 };
    const totalGastos = gastos[0]?.totalGastos || 0;
    const costosTotales = datosVentas.costoProductos + datosVentas.comisionesMP + totalGastos;
    const ganancia = datosVentas.ingresoTotal - costosTotales;

    // ROI: (ganancia - presupuesto) / presupuesto * 100
    const roi = campana.presupuesto > 0 ? (((ganancia - campana.presupuesto) / campana.presupuesto) * 100) : null;

    res.json({
      exito: true,
      datos: {
        campana,
        resultados: {
          ingresoTotal: datosVentas.ingresoTotal,
          costoProductos: datosVentas.costoProductos,
          comisionesMP: datosVentas.comisionesMP,
          gastosOperativos: totalGastos,
          costosTotales,
          ganancia,
          cantidadVentas: datosVentas.cantidadVentas,
          ticketPromedio: Math.round((datosVentas.ticketPromedio || 0) * 100) / 100,
          presupuesto: campana.presupuesto,
          roi: roi !== null ? Math.round(roi * 100) / 100 : null,
        },
      },
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ exito: false, mensaje: 'ID inválido.' });
    }
    console.error('Error en resultados campaña:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener resultados.' });
  }
});

// ─── GET /api/campanas/comparar ────────────────────────
// Comparar dos o más campañas
router.get('/accion/comparar', verificarAdmin, async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ exito: false, mensaje: 'Enviar ids separados por coma.' });
    }

    const idsArr = ids.split(',').map((id) => id.trim());
    const campanas = await Campana.find({ _id: { $in: idsArr } });

    if (campanas.length < 2) {
      return res.status(400).json({ exito: false, mensaje: 'Se necesitan al menos 2 campañas para comparar.' });
    }

    const estadosValidos = ['aprobado', 'enviado', 'entregado'];
    const resultados = [];

    for (const campana of campanas) {
      const ventas = await Orden.aggregate([
        {
          $match: {
            estado: { $in: estadosValidos },
            createdAt: { $gte: campana.fechaInicio, $lte: campana.fechaFin },
          },
        },
        {
          $group: {
            _id: null,
            ingresoTotal: { $sum: '$total' },
            costoProductos: { $sum: '$costoProductos' },
            comisionesMP: { $sum: '$comisionMP' },
            cantidadVentas: { $sum: 1 },
          },
        },
      ]);

      const gastos = await Gasto.aggregate([
        {
          $match: {
            fecha: { $gte: campana.fechaInicio, $lte: campana.fechaFin },
          },
        },
        {
          $group: {
            _id: null,
            totalGastos: { $sum: '$monto' },
          },
        },
      ]);

      const dv = ventas[0] || { ingresoTotal: 0, costoProductos: 0, comisionesMP: 0, cantidadVentas: 0 };
      const tg = gastos[0]?.totalGastos || 0;
      const ganancia = dv.ingresoTotal - dv.costoProductos - dv.comisionesMP - tg;
      const roi = campana.presupuesto > 0 ? (((ganancia - campana.presupuesto) / campana.presupuesto) * 100) : null;

      resultados.push({
        campana: { _id: campana._id, nombre: campana.nombre, tipo: campana.tipo, fechaInicio: campana.fechaInicio, fechaFin: campana.fechaFin },
        ingresoTotal: dv.ingresoTotal,
        cantidadVentas: dv.cantidadVentas,
        costosTotales: dv.costoProductos + dv.comisionesMP + tg,
        ganancia,
        presupuesto: campana.presupuesto,
        roi: roi !== null ? Math.round(roi * 100) / 100 : null,
      });
    }

    res.json({ exito: true, datos: resultados });
  } catch (error) {
    console.error('Error al comparar campañas:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al comparar campañas.' });
  }
});

module.exports = router;
