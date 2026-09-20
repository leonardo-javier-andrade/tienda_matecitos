const express = require('express');
const router = express.Router();
const Orden = require('../models/Order');
const Gasto = require('../models/Gasto');
const Producto = require('../models/Product');
const { verificarAdmin } = require('../middleware/auth');

// ─── Helpers ───────────────────────────────────────────
function parseFechas(query) {
  const ahora = new Date();
  const desde = query.desde ? new Date(query.desde) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hasta = query.hasta ? new Date(query.hasta) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
  return { desde, hasta };
}

// ─── GET /api/finanzas/balance ─────────────────────────
// P&L de un período
router.get('/balance', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = parseFechas(req.query);

    // Ingresos: ventas aprobadas/enviadas/entregadas en el período
    const estadosValidos = ['aprobado', 'enviado', 'entregado'];
    const ventas = await Orden.aggregate([
      {
        $match: {
          estado: { $in: estadosValidos },
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: null,
          ingresoTotal: { $sum: '$total' },
          costoEnvioTotal: { $sum: '$costoEnvio' },
          comisionMPTotal: { $sum: '$comisionMP' },
          costoProductosTotal: { $sum: '$costoProductos' },
          cantidadVentas: { $sum: 1 },
        },
      },
    ]);

    // Ingresos por canal
    const ventasPorCanal = await Orden.aggregate([
      {
        $match: {
          estado: { $in: estadosValidos },
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: '$canal',
          ingreso: { $sum: '$total' },
          cantidad: { $sum: 1 },
          comisionMP: { $sum: '$comisionMP' },
          costoProductos: { $sum: '$costoProductos' },
        },
      },
    ]);

    // Gastos operativos del período
    const gastos = await Gasto.aggregate([
      {
        $match: {
          fecha: { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: '$monto' },
          cantidad: { $sum: 1 },
        },
      },
    ]);

    const totalGastos = gastos.reduce((acc, g) => acc + g.total, 0);
    const datosVentas = ventas[0] || { ingresoTotal: 0, costoEnvioTotal: 0, comisionMPTotal: 0, costoProductosTotal: 0, cantidadVentas: 0 };

    const ingresoNeto = datosVentas.ingresoTotal - datosVentas.costoEnvioTotal;
    const costosTotales = datosVentas.costoProductosTotal + datosVentas.comisionMPTotal + totalGastos;
    const gananciaBruta = ingresoNeto - datosVentas.costoProductosTotal;
    const gananciaNeta = ingresoNeto - costosTotales;
    const margen = ingresoNeto > 0 ? ((gananciaNeta / ingresoNeto) * 100) : 0;

    res.json({
      exito: true,
      datos: {
        periodo: { desde, hasta },
        ingresos: {
          total: datosVentas.ingresoTotal,
          envios: datosVentas.costoEnvioTotal,
          neto: ingresoNeto,
          cantidadVentas: datosVentas.cantidadVentas,
        },
        costos: {
          productos: datosVentas.costoProductosTotal,
          comisionesMP: datosVentas.comisionMPTotal,
          gastosOperativos: totalGastos,
          detalleGastos: gastos,
          total: costosTotales,
        },
        resultado: {
          gananciaBruta,
          gananciaNeta,
          margen: Math.round(margen * 100) / 100,
        },
        canales: ventasPorCanal,
      },
    });
  } catch (error) {
    console.error('Error en balance:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al calcular balance.' });
  }
});

// ─── GET /api/finanzas/margenes ────────────────────────
// Margen por producto
router.get('/margenes', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = parseFechas(req.query);
    const estadosValidos = ['aprobado', 'enviado', 'entregado'];

    // Ventas por producto en el período
    const ventasProducto = await Orden.aggregate([
      {
        $match: {
          estado: { $in: estadosValidos },
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.producto',
          nombre: { $first: '$items.nombre' },
          precioVenta: { $avg: '$items.precio' },
          unidadesVendidas: { $sum: '$items.cantidad' },
          ingresoTotal: { $sum: { $multiply: ['$items.precio', '$items.cantidad'] } },
        },
      },
      { $sort: { ingresoTotal: -1 } },
    ]);

    // Enriquecer con costo unitario desde producto
    const productIds = ventasProducto.map((v) => v._id);
    const productos = await Producto.find({ _id: { $in: productIds } }).select('costoUnitario precio');
    const costoMap = {};
    productos.forEach((p) => {
      costoMap[p._id.toString()] = p.costoUnitario || 0;
    });

    const margenes = ventasProducto.map((v) => {
      const costo = costoMap[v._id?.toString()] || 0;
      const margenUnit = v.precioVenta - costo;
      const margenPct = v.precioVenta > 0 ? ((margenUnit / v.precioVenta) * 100) : 0;
      const gananciaTotal = margenUnit * v.unidadesVendidas;

      return {
        productoId: v._id,
        nombre: v.nombre,
        precioVenta: Math.round(v.precioVenta * 100) / 100,
        costoUnitario: costo,
        margenUnitario: Math.round(margenUnit * 100) / 100,
        margenPorcentaje: Math.round(margenPct * 100) / 100,
        unidadesVendidas: v.unidadesVendidas,
        ingresoTotal: Math.round(v.ingresoTotal * 100) / 100,
        gananciaTotal: Math.round(gananciaTotal * 100) / 100,
        sinCosto: costo === 0,
        margenNegativo: margenUnit < 0,
      };
    });

    // Productos sin costo cargado (alerta)
    const sinCosto = await Producto.find({ costoUnitario: { $in: [0, null, undefined] }, activo: true }).select('nombre precio');

    res.json({
      exito: true,
      datos: {
        periodo: { desde, hasta },
        margenes,
        alertas: {
          productosSinCosto: sinCosto,
          productosMargenNegativo: margenes.filter((m) => m.margenNegativo),
        },
      },
    });
  } catch (error) {
    console.error('Error en márgenes:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al calcular márgenes.' });
  }
});

// ─── GET /api/finanzas/tendencia ───────────────────────
// Evolución mensual de ingresos vs gastos
router.get('/tendencia', verificarAdmin, async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 6;
    const ahora = new Date();
    const desde = new Date(ahora.getFullYear(), ahora.getMonth() - meses + 1, 1);
    const estadosValidos = ['aprobado', 'enviado', 'entregado'];

    const ingresosMensuales = await Orden.aggregate([
      {
        $match: {
          estado: { $in: estadosValidos },
          createdAt: { $gte: desde },
        },
      },
      {
        $group: {
          _id: {
            anio: { $year: '$createdAt' },
            mes: { $month: '$createdAt' },
          },
          ingreso: { $sum: '$total' },
          costoProductos: { $sum: '$costoProductos' },
          comisionesMP: { $sum: '$comisionMP' },
          ventas: { $sum: 1 },
        },
      },
      { $sort: { '_id.anio': 1, '_id.mes': 1 } },
    ]);

    const gastosMensuales = await Gasto.aggregate([
      {
        $match: {
          fecha: { $gte: desde },
        },
      },
      {
        $group: {
          _id: {
            anio: { $year: '$fecha' },
            mes: { $month: '$fecha' },
          },
          gastos: { $sum: '$monto' },
        },
      },
      { $sort: { '_id.anio': 1, '_id.mes': 1 } },
    ]);

    // Combinar datos por mes
    const gastosMap = {};
    gastosMensuales.forEach((g) => {
      gastosMap[`${g._id.anio}-${g._id.mes}`] = g.gastos;
    });

    const tendencia = ingresosMensuales.map((i) => {
      const key = `${i._id.anio}-${i._id.mes}`;
      const gastosOp = gastosMap[key] || 0;
      const costosTotales = i.costoProductos + i.comisionesMP + gastosOp;
      const ganancia = i.ingreso - costosTotales;

      return {
        anio: i._id.anio,
        mes: i._id.mes,
        ingreso: i.ingreso,
        costoProductos: i.costoProductos,
        comisionesMP: i.comisionesMP,
        gastosOperativos: gastosOp,
        costosTotales,
        ganancia,
        ventas: i.ventas,
      };
    });

    res.json({ exito: true, datos: tendencia });
  } catch (error) {
    console.error('Error en tendencia:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al calcular tendencia.' });
  }
});

// ─── GET /api/finanzas/canales ─────────────────────────
// Desglose de ventas por canal con margen promedio
router.get('/canales', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = parseFechas(req.query);
    const estadosValidos = ['aprobado', 'enviado', 'entregado'];

    const canales = await Orden.aggregate([
      {
        $match: {
          estado: { $in: estadosValidos },
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
      {
        $group: {
          _id: '$canal',
          ingreso: { $sum: '$total' },
          costoProductos: { $sum: '$costoProductos' },
          comisionMP: { $sum: '$comisionMP' },
          cantidadVentas: { $sum: 1 },
          ticketPromedio: { $avg: '$total' },
        },
      },
    ]);

    const resultado = canales.map((c) => {
      const gananciaBruta = c.ingreso - c.costoProductos - c.comisionMP;
      const margen = c.ingreso > 0 ? ((gananciaBruta / c.ingreso) * 100) : 0;

      return {
        canal: c._id || 'online',
        ingreso: Math.round(c.ingreso * 100) / 100,
        costoProductos: Math.round(c.costoProductos * 100) / 100,
        comisionMP: Math.round(c.comisionMP * 100) / 100,
        gananciaBruta: Math.round(gananciaBruta * 100) / 100,
        margen: Math.round(margen * 100) / 100,
        cantidadVentas: c.cantidadVentas,
        ticketPromedio: Math.round((c.ticketPromedio || 0) * 100) / 100,
      };
    });

    res.json({
      exito: true,
      datos: {
        periodo: { desde, hasta },
        canales: resultado,
      },
    });
  } catch (error) {
    console.error('Error en canales:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al calcular canales.' });
  }
});

module.exports = router;
