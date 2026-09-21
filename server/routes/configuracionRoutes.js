const express = require('express');
const router = express.Router();
const Configuracion = require('../models/Configuracion');
const { verificarAdmin } = require('../middleware/auth');

// GET /api/configuracion — Obtener configuración actual
router.get('/', verificarAdmin, async (req, res) => {
  try {
    const config = await Configuracion.getConfig();
    res.json({ exito: true, datos: config });
  } catch (error) {
    console.error('Error al obtener configuración:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener configuración.' });
  }
});

// PUT /api/configuracion — Actualizar configuración
router.put('/', verificarAdmin, async (req, res) => {
  try {
    const { comisionMP, ivaComision, aplicarIva } = req.body;
    const config = await Configuracion.getConfig();

    if (comisionMP !== undefined) config.comisionMP = comisionMP;
    if (ivaComision !== undefined) config.ivaComision = ivaComision;
    if (aplicarIva !== undefined) config.aplicarIva = aplicarIva;

    await config.save();
    res.json({ exito: true, mensaje: 'Configuración actualizada.', datos: config });
  } catch (error) {
    console.error('Error al actualizar configuración:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar configuración.' });
  }
});

module.exports = router;
