const express = require('express');
const router = express.Router();
const { verificarAdmin } = require('../middleware/auth');
const Orden = require('../models/Order');
const Producto = require('../models/Product');
const Configuracion = require('../models/Configuracion');

// ─── GET /api/dashboard/resumen — KPIs financieros ────
router.get('/resumen', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtroFecha = {};
    if (desde) filtroFecha.$gte = new Date(desde);
    if (hasta) filtroFecha.$lte = new Date(hasta);

    const matchStage = { estado: { $in: ['aprobado', 'enviado', 'entregado'] } };
    if (desde || hasta) matchStage.createdAt = filtroFecha;

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          ingresosBrutos: { $sum: '$totalPagadoCliente' },
          fondoEnvios: { $sum: '$envioCobradoAlCliente' },
          costoMercaderia: { $sum: '$costoTotalProductos' },
          comisionesMP: { $sum: '$comisionMPCalculada' },
          ivaTotal: { $sum: '$ivaCalculado' },
          gananciaNeta: { $sum: '$gananciaNetaEstimada' },
          totalOrdenes: { $sum: 1 },
          // Fallback para ordenes legacy sin desglose
          totalLegacy: { $sum: '$total' },
          costoEnvioLegacy: { $sum: '$costoEnvio' },
        },
      },
    ];

    const [resultado] = await Orden.aggregate(pipeline);

    // Si no hay resultado de los nuevos campos, usar legacy
    const datos = resultado || {
      ingresosBrutos: 0,
      fondoEnvios: 0,
      costoMercaderia: 0,
      comisionesMP: 0,
      ivaTotal: 0,
      gananciaNeta: 0,
      totalOrdenes: 0,
      totalLegacy: 0,
      costoEnvioLegacy: 0,
    };

    // Si los nuevos campos estan en 0 pero hay datos legacy, calcular desde legacy
    if (datos.ingresosBrutos === 0 && datos.totalLegacy > 0) {
      datos.ingresosBrutos = datos.totalLegacy;
      datos.fondoEnvios = datos.costoEnvioLegacy;
    }

    res.json({ exito: true, datos });
  } catch (error) {
    console.error('Error en resumen dashboard:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener resumen.' });
  }
});

// ─── GET /api/dashboard/desglose — Desglose para donut chart ──
router.get('/desglose', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtroFecha = {};
    if (desde) filtroFecha.$gte = new Date(desde);
    if (hasta) filtroFecha.$lte = new Date(hasta);

    const matchStage = { estado: { $in: ['aprobado', 'enviado', 'entregado'] } };
    if (desde || hasta) matchStage.createdAt = filtroFecha;

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          costoProductos: { $sum: '$costoTotalProductos' },
          ganancia: { $sum: '$gananciaNetaEstimada' },
          fondoEnvios: { $sum: '$envioCobradoAlCliente' },
          comisionesMP: { $sum: '$comisionMPCalculada' },
          iva: { $sum: '$ivaCalculado' },
        },
      },
    ];

    const [resultado] = await Orden.aggregate(pipeline);

    res.json({
      exito: true,
      datos: resultado || {
        costoProductos: 0,
        ganancia: 0,
        fondoEnvios: 0,
        comisionesMP: 0,
        iva: 0,
      },
    });
  } catch (error) {
    console.error('Error en desglose:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener desglose.' });
  }
});

// ─── GET /api/dashboard/alertas-stock — Productos con stock bajo ──
router.get('/alertas-stock', verificarAdmin, async (req, res) => {
  try {
    const productos = await Producto.find({
      activo: true,
      $expr: { $lte: ['$stock', '$stockCritico'] },
    })
      .select('nombre stock stockCritico costoUnitario precio imagenes categoria')
      .sort({ stock: 1 })
      .limit(20);

    res.json({ exito: true, datos: productos });
  } catch (error) {
    console.error('Error alertas stock:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener alertas.' });
  }
});

// ─── GET /api/dashboard/logistica — Ordenes pendientes de despacho ──
router.get('/logistica', verificarAdmin, async (req, res) => {
  try {
    const ordenes = await Orden.find({
      estado: { $in: ['aprobado', 'enviado'] },
      estadoDespacho: { $in: ['pendiente', 'preparando'] },
    })
      .populate('usuario', 'nombre email')
      .select('items total costoEnvio estadoDespacho logisticaPagada datosEnvio canal createdAt')
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ exito: true, datos: ordenes });
  } catch (error) {
    console.error('Error logistica:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener logistica.' });
  }
});

// ─── PUT /api/dashboard/logistica/:id/despacho — Actualizar despacho ──
router.put('/logistica/:id/despacho', verificarAdmin, async (req, res) => {
  try {
    const { estadoDespacho } = req.body;
    const validos = ['pendiente', 'preparando', 'despachado', 'entregado'];
    if (!validos.includes(estadoDespacho)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado de despacho no valido.' });
    }

    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      { estadoDespacho },
      { new: true }
    );

    if (!orden) {
      return res.status(404).json({ exito: false, mensaje: 'Orden no encontrada.' });
    }

    res.json({ exito: true, datos: orden });
  } catch (error) {
    console.error('Error actualizar despacho:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar despacho.' });
  }
});

// ─── PUT /api/dashboard/logistica/:id/pagada — Marcar logistica pagada ──
router.put('/logistica/:id/pagada', verificarAdmin, async (req, res) => {
  try {
    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      { logisticaPagada: true },
      { new: true }
    );

    if (!orden) {
      return res.status(404).json({ exito: false, mensaje: 'Orden no encontrada.' });
    }

    res.json({ exito: true, datos: orden });
  } catch (error) {
    console.error('Error marcar logistica pagada:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al marcar pagada.' });
  }
});

// ─── GET /api/dashboard/top-productos — Top 5 mas vendidos ──
router.get('/top-productos', verificarAdmin, async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtroFecha = {};
    if (desde) filtroFecha.$gte = new Date(desde);
    if (hasta) filtroFecha.$lte = new Date(hasta);

    const matchStage = { estado: { $in: ['aprobado', 'enviado', 'entregado'] } };
    if (desde || hasta) matchStage.createdAt = filtroFecha;

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.producto',
          nombre: { $first: '$items.nombre' },
          totalVendido: { $sum: '$items.cantidad' },
          ingresoTotal: { $sum: { $multiply: ['$items.precio', '$items.cantidad'] } },
        },
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 5 },
    ];

    const resultado = await Orden.aggregate(pipeline);

    res.json({ exito: true, datos: resultado });
  } catch (error) {
    console.error('Error top productos:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener top productos.' });
  }
});

// ─── GET /api/dashboard/stock — Control de stock con filtros ──
router.get('/stock', verificarAdmin, async (req, res) => {
  try {
    const { categoria, tipo, buscar, page = 1, limit = 50 } = req.query;

    const filtro = { activo: true };
    if (categoria) filtro.categoria = categoria;
    if (tipo) filtro.tipoProducto = tipo;
    if (buscar) {
      filtro.$or = [
        { nombre: { $regex: buscar, $options: 'i' } },
        { sku: { $regex: buscar, $options: 'i' } },
      ];
    }

    const productos = await Producto.find(filtro)
      .select(
        'nombre sku categoria tipoProducto stock costoUnitario gastoEnvio porcentajeMargen precio fechaIngreso stockCritico imagenes'
      )
      .sort({ fechaIngreso: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Producto.countDocuments(filtro);

    // KPIs de stock
    const kpis = await Producto.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: null,
          totalArticulos: { $sum: '$stock' },
          capitalInvertido: {
            $sum: { $multiply: ['$costoUnitario', '$stock'] },
          },
          costosLogistica: {
            $sum: { $multiply: ['$gastoEnvio', '$stock'] },
          },
          valorVentaPotencial: {
            $sum: { $multiply: ['$precio', '$stock'] },
          },
          cantidadProductos: { $sum: 1 },
        },
      },
    ]);

    res.json({
      exito: true,
      datos: productos,
      total,
      paginas: Math.ceil(total / limit),
      kpis: kpis[0] || {
        totalArticulos: 0,
        capitalInvertido: 0,
        costosLogistica: 0,
        valorVentaPotencial: 0,
        cantidadProductos: 0,
      },
    });
  } catch (error) {
    console.error('Error stock dashboard:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener stock.' });
  }
});

// ─── POST /api/dashboard/venta-manual — Registrar venta externa ──
router.post('/venta-manual', verificarAdmin, async (req, res) => {
  try {
    const { items, canal, metodoPago, notasVenta, datosEnvio } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'Debe incluir al menos un item.' });
    }

    const config = await Configuracion.getConfig();
    const itemsOrden = [];
    let subtotalProductos = 0;
    let costoTotalProductos = 0;

    for (const item of items) {
      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res
          .status(400)
          .json({ exito: false, mensaje: `Producto no encontrado: ${item.productoId}` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          exito: false,
          mensaje: `Stock insuficiente de "${producto.nombre}". Disponible: ${producto.stock}.`,
        });
      }

      const subtotal = producto.precio * item.cantidad;
      subtotalProductos += subtotal;
      costoTotalProductos += producto.costoUnitario * item.cantidad;

      itemsOrden.push({
        producto: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        imagen: producto.imagenes?.[0]?.url || '',
        costoUnitario: producto.costoUnitario,
      });

      // Descontar stock
      await Producto.findByIdAndUpdate(producto._id, {
        $inc: { stock: -item.cantidad },
      });
    }

    // En ventas manuales no hay comision MP (salvo transferencia)
    const comisionMPCalculada = 0;
    const ivaCalculado = 0;
    const totalPagadoCliente = subtotalProductos;
    const gananciaNetaEstimada = subtotalProductos - costoTotalProductos;

    const orden = new Orden({
      items: itemsOrden,
      total: totalPagadoCliente,
      origen: 'manual',
      canal: canal || 'presencial',
      metodoPago: metodoPago || 'efectivo',
      estado: 'entregado',
      estadoDespacho: 'entregado',
      notasVenta: notasVenta || '',
      subtotalProductos,
      envioCobradoAlCliente: 0,
      comisionMPCalculada,
      ivaCalculado,
      totalPagadoCliente,
      costoTotalProductos,
      gananciaNetaEstimada,
      costoProductos: costoTotalProductos,
      datosEnvio: datosEnvio || {},
    });

    await orden.save();

    res.json({
      exito: true,
      mensaje: 'Venta manual registrada correctamente.',
      datos: orden,
    });
  } catch (error) {
    console.error('Error venta manual:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al registrar venta manual.' });
  }
});

// ─── GET /api/dashboard/ventas-periodo — Ventas por periodo (para grafico) ──
router.get('/ventas-periodo', verificarAdmin, async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(dias));

    const pipeline = [
      {
        $match: {
          estado: { $in: ['aprobado', 'enviado', 'entregado'] },
          createdAt: { $gte: desde },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          ingresos: { $sum: '$totalPagadoCliente' },
          costos: { $sum: '$costoTotalProductos' },
          ganancia: { $sum: '$gananciaNetaEstimada' },
          ordenes: { $sum: 1 },
          // Legacy fallback
          totalLegacy: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const resultado = await Orden.aggregate(pipeline);

    // Fallback: si ingresos es 0 pero legacy tiene datos
    const datos = resultado.map((d) => ({
      fecha: d._id,
      ingresos: d.ingresos || d.totalLegacy,
      costos: d.costos,
      ganancia: d.ganancia || d.totalLegacy - d.costos,
      ordenes: d.ordenes,
    }));

    res.json({ exito: true, datos });
  } catch (error) {
    console.error('Error ventas periodo:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener ventas por periodo.' });
  }
});

module.exports = router;
