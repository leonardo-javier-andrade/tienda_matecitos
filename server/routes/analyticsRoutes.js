const express = require('express');
const router = express.Router();
const Orden = require('../models/Order');
const Producto = require('../models/Product');
const { verificarAdmin } = require('../middleware/auth');
const { enviarNotificacionCompra, enviarInformeVentas } = require('../services/emailService');

// ─── GET /api/analytics/resumen — Resumen general del negocio ───
router.get('/resumen', verificarAdmin, async (req, res) => {
  try {
    const [
      totalOrdenes,
      ordenesAprobadas,
      ordenesPendientes,
      totalProductos,
      productosSinStock,
    ] = await Promise.all([
      Orden.countDocuments(),
      Orden.countDocuments({ estado: 'aprobado' }),
      Orden.countDocuments({ estado: 'pendiente' }),
      Producto.countDocuments({ activo: true }),
      Producto.countDocuments({ activo: true, stock: 0 }),
    ]);

    // Ingresos totales (solo órdenes aprobadas/enviadas/entregadas)
    const ingresos = await Orden.aggregate([
      { $match: { estado: { $in: ['aprobado', 'enviado', 'entregado'] } } },
      { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
    ]);

    // Ingresos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ingresosMes = await Orden.aggregate([
      {
        $match: {
          estado: { $in: ['aprobado', 'enviado', 'entregado'] },
          createdAt: { $gte: inicioMes },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
    ]);

    // Ingresos de la semana actual
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const ingresosSemana = await Orden.aggregate([
      {
        $match: {
          estado: { $in: ['aprobado', 'enviado', 'entregado'] },
          createdAt: { $gte: inicioSemana },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
    ]);

    res.json({
      exito: true,
      datos: {
        ordenes: {
          total: totalOrdenes,
          aprobadas: ordenesAprobadas,
          pendientes: ordenesPendientes,
        },
        productos: {
          total: totalProductos,
          sinStock: productosSinStock,
        },
        ingresos: {
          total: ingresos[0]?.total || 0,
          ventasTotales: ingresos[0]?.cantidad || 0,
          mes: ingresosMes[0]?.total || 0,
          ventasMes: ingresosMes[0]?.cantidad || 0,
          semana: ingresosSemana[0]?.total || 0,
          ventasSemana: ingresosSemana[0]?.cantidad || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error en resumen analytics:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener resumen.' });
  }
});

// ─── GET /api/analytics/productos-vendidos — Ranking de productos más vendidos ───
router.get('/productos-vendidos', verificarAdmin, async (req, res) => {
  try {
    const { periodo = 'todo', limit = 20 } = req.query;

    const matchStage = { estado: { $in: ['aprobado', 'enviado', 'entregado'] } };

    if (periodo === 'semana') {
      const hace7dias = new Date();
      hace7dias.setDate(hace7dias.getDate() - 7);
      matchStage.createdAt = { $gte: hace7dias };
    } else if (periodo === 'mes') {
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);
      matchStage.createdAt = { $gte: hace30dias };
    }

    const vendidos = await Orden.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.producto',
          nombre: { $first: '$items.nombre' },
          imagen: { $first: '$items.imagen' },
          cantidadVendida: { $sum: '$items.cantidad' },
          ingresoTotal: { $sum: { $multiply: ['$items.precio', '$items.cantidad'] } },
        },
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: Number(limit) },
    ]);

    res.json({ exito: true, datos: vendidos });
  } catch (error) {
    console.error('Error en productos vendidos:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener productos vendidos.' });
  }
});

// ─── GET /api/analytics/productos-visitados — Ranking de productos más visitados ───
router.get('/productos-visitados', verificarAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const productos = await Producto.find({ activo: true })
      .sort({ visitas: -1 })
      .limit(Number(limit))
      .select('nombre imagenes visitas precio stock categoria');

    res.json({
      exito: true,
      datos: productos.map((p) => ({
        _id: p._id,
        nombre: p.nombre,
        imagen: p.imagenes?.[0]?.url || '',
        visitas: p.visitas || 0,
        precio: p.precio,
        stock: p.stock,
        categoria: p.categoria,
      })),
    });
  } catch (error) {
    console.error('Error en productos visitados:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener productos visitados.' });
  }
});

// ─── GET /api/analytics/menos-vendidos — Productos menos vendidos ───
router.get('/menos-vendidos', verificarAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Obtener todos los productos activos
    const productos = await Producto.find({ activo: true }).select('nombre imagenes precio stock categoria');

    // Obtener ventas de cada producto
    const ventas = await Orden.aggregate([
      { $match: { estado: { $in: ['aprobado', 'enviado', 'entregado'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.producto',
          cantidadVendida: { $sum: '$items.cantidad' },
        },
      },
    ]);

    const ventasMap = {};
    ventas.forEach((v) => { ventasMap[v._id.toString()] = v.cantidadVendida; });

    // Combinar y ordenar (menos vendidos primero)
    const resultado = productos
      .map((p) => ({
        _id: p._id,
        nombre: p.nombre,
        imagen: p.imagenes?.[0]?.url || '',
        precio: p.precio,
        stock: p.stock,
        categoria: p.categoria,
        cantidadVendida: ventasMap[p._id.toString()] || 0,
      }))
      .sort((a, b) => a.cantidadVendida - b.cantidadVendida)
      .slice(0, Number(limit));

    res.json({ exito: true, datos: resultado });
  } catch (error) {
    console.error('Error en menos vendidos:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener productos menos vendidos.' });
  }
});

// ─── GET /api/analytics/ventas-por-dia — Ventas agrupadas por día (últimos 30 días) ───
router.get('/ventas-por-dia', verificarAdmin, async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(dias));
    desde.setHours(0, 0, 0, 0);

    const ventasPorDia = await Orden.aggregate([
      {
        $match: {
          estado: { $in: ['aprobado', 'enviado', 'entregado'] },
          createdAt: { $gte: desde },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ exito: true, datos: ventasPorDia });
  } catch (error) {
    console.error('Error en ventas por día:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener ventas por día.' });
  }
});

// ─── POST /api/analytics/enviar-informe — Enviar informe por email (admin) ───
router.post('/enviar-informe', verificarAdmin, async (req, res) => {
  try {
    await enviarInformeVentas();
    res.json({ exito: true, mensaje: 'Informe enviado a tiendamatecitos@gmail.com' });
  } catch (error) {
    console.error('Error al enviar informe:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al enviar el informe: ' + error.message });
  }
});

module.exports = router;
