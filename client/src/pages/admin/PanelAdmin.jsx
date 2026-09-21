import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerTodasOrdenes, actualizarEstadoOrden,
  obtenerResumenAnalytics, obtenerProductosVendidos, obtenerProductosVisitados, obtenerVentasPorDia,
  obtenerBalance, obtenerMargenes, obtenerTendencia, obtenerCanales,
  obtenerConfiguracion, actualizarConfiguracion,
  obtenerGastos, obtenerResumenGastos, crearGasto, actualizarGasto, eliminarGasto,
  obtenerCampanas, obtenerCampana, crearCampana, actualizarCampana, eliminarCampana, obtenerResultadosCampana,
  obtenerTodosProductos
} from '../../services/api';
import './PanelAdmin.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

const formatFecha = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ESTADOS_ORDEN = ['todos', 'pendiente', 'aprobado', 'enviado', 'entregado', 'cancelado'];

const ESTADO_COLORES = {
  pendiente: { bg: '#ffeaa7', color: '#6c5b3e' },
  aprobado: { bg: '#55efc4', color: '#00695c' },
  enviado: { bg: '#74b9ff', color: '#0a3d62' },
  entregado: { bg: '#00b894', color: '#fff' },
  cancelado: { bg: '#fab1a0', color: '#d63031' },
};

const CATEGORIAS_GASTO = [
  'Materia prima', 'Envío', 'Publicidad', 'Plataforma', 'Impuestos', 'Otros'
];

// ============================================================
// SUB-COMPONENTS
// ============================================================

function EstadoBadge({ estado }) {
  const estilo = ESTADO_COLORES[estado] || { bg: '#dfe6e9', color: '#2d3436' };
  return (
    <span
      className="panel-badge"
      style={{ backgroundColor: estilo.bg, color: estilo.color }}
    >
      {estado}
    </span>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      className={`panel-tab-btn ${active ? 'panel-tab-btn--active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Card({ titulo, valor, subtitulo, icono }) {
  return (
    <div className="panel-card">
      <div className="panel-card__icon">{icono}</div>
      <div className="panel-card__body">
        <p className="panel-card__titulo">{titulo}</p>
        <p className="panel-card__valor">{valor}</p>
        {subtitulo && <p className="panel-card__sub">{subtitulo}</p>}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return <div className="panel-loading">Cargando...</div>;
}

// ============================================================
// TAB: ORDENES
// ============================================================

function TabOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [expandedId, setExpandedId] = useState(null);
  const [actualizando, setActualizando] = useState(null);

  const cargarOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await obtenerTodasOrdenes();
      setOrdenes(Array.isArray(data) ? data : (data?.ordenes || []));
    } catch (err) {
      console.error('Error cargando órdenes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarOrdenes(); }, [cargarOrdenes]);

  const ordenesFiltradas = filtroEstado === 'todos'
    ? ordenes
    : ordenes.filter(o => o.estado === filtroEstado);

  const handleCambiarEstado = async (ordenId, nuevoEstado) => {
    try {
      setActualizando(ordenId);
      await actualizarEstadoOrden(ordenId, nuevoEstado);
      setOrdenes(prev =>
        prev.map(o => o._id === ordenId ? { ...o, estado: nuevoEstado } : o)
      );
    } catch (err) {
      console.error('Error actualizando estado:', err);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setActualizando(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <h2>Gestión de Órdenes</h2>
        <Link to="/admin/venta-manual" className="panel-btn panel-btn--primary">
          + Registrar venta manual
        </Link>
      </div>

      <div className="panel-filtros">
        {ESTADOS_ORDEN.map(est => (
          <button
            key={est}
            className={`panel-filtro-btn ${filtroEstado === est ? 'panel-filtro-btn--active' : ''}`}
            onClick={() => setFiltroEstado(est)}
          >
            {est.charAt(0).toUpperCase() + est.slice(1)}
            {est !== 'todos' && (
              <span className="panel-filtro-count">
                {ordenes.filter(o => o.estado === est).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {ordenesFiltradas.length === 0 ? (
        <div className="panel-empty">No hay órdenes {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}</div>
      ) : (
        <div className="panel-table-wrapper">
          <table className="panel-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Comprador</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Canal</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map(orden => (
                <React.Fragment key={orden._id}>
                  <tr
                    className={`panel-table__row ${expandedId === orden._id ? 'panel-table__row--expanded' : ''}`}
                    onClick={() => toggleExpand(orden._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="panel-table__id">
                      #{(orden._id || '').slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div className="panel-comprador">
                        <span className="panel-comprador__nombre">
                          {orden.comprador?.nombre || orden.nombreComprador || 'Sin nombre'}
                        </span>
                        <span className="panel-comprador__email">
                          {orden.comprador?.email || orden.emailComprador || ''}
                        </span>
                      </div>
                    </td>
                    <td className="panel-table__money">{formatMoney(orden.total)}</td>
                    <td><EstadoBadge estado={orden.estado} /></td>
                    <td>{orden.canal || 'web'}</td>
                    <td>{formatFecha(orden.createdAt || orden.fecha)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className="panel-select-estado"
                        value={orden.estado}
                        disabled={actualizando === orden._id}
                        onChange={e => handleCambiarEstado(orden._id, e.target.value)}
                      >
                        {ESTADOS_ORDEN.filter(e => e !== 'todos').map(est => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === orden._id && (
                    <tr className="panel-table__detail-row">
                      <td colSpan={7}>
                        <div className="panel-orden-detalle">
                          <div className="panel-orden-detalle__items">
                            <h4>Productos</h4>
                            {(orden.items || orden.productos || []).map((item, idx) => (
                              <div key={idx} className="panel-orden-item">
                                <span>{item.nombre || item.producto?.nombre || 'Producto'}</span>
                                <span>x{item.cantidad}</span>
                                <span>{formatMoney(item.precio || item.precioUnitario)}</span>
                                <span>{formatMoney((item.precio || item.precioUnitario) * item.cantidad)}</span>
                              </div>
                            ))}
                          </div>
                          {(orden.comprador?.telefono || orden.telefonoComprador) && (
                            <div className="panel-orden-detalle__contacto">
                              <h4>Contacto</h4>
                              <p>Tel: {orden.comprador?.telefono || orden.telefonoComprador}</p>
                            </div>
                          )}
                          {orden.notas && (
                            <div className="panel-orden-detalle__notas">
                              <h4>Notas</h4>
                              <p>{orden.notas}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel-resumen-ordenes">
        <span>Total: {ordenesFiltradas.length} órdenes</span>
        <span>Monto total: {formatMoney(ordenesFiltradas.reduce((s, o) => s + (o.total || 0), 0))}</span>
      </div>
    </div>
  );
}

// ============================================================
// TAB: ANALYTICS
// ============================================================

function TabAnalytics() {
  const [resumen, setResumen] = useState(null);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [res, prods, ventas] = await Promise.all([
          obtenerResumenAnalytics(),
          obtenerProductosVendidos(),
          obtenerVentasPorDia()
        ]);
        setResumen(res);
        setProductosVendidos(Array.isArray(prods) ? prods : (prods?.productos || []));
        setVentasPorDia(Array.isArray(ventas) ? ventas : (ventas?.ventas || []));
      } catch (err) {
        console.error('Error cargando analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalVentas = resumen?.totalVentas || resumen?.total_ventas || 0;
  const ingresos = resumen?.ingresosTotales || resumen?.ingresos || 0;
  const ticket = totalVentas > 0 ? ingresos / totalVentas : 0;
  const totalProductos = resumen?.productosVendidos || resumen?.productos_vendidos || 0;

  return (
    <div className="panel-section">
      <h2>Analytics</h2>

      <div className="panel-cards-grid">
        <Card titulo="Total ventas" valor={totalVentas} icono="🛒" />
        <Card titulo="Ingresos totales" valor={formatMoney(ingresos)} icono="💰" />
        <Card titulo="Ticket promedio" valor={formatMoney(ticket)} icono="🎫" />
        <Card titulo="Productos vendidos" valor={totalProductos} icono="📦" />
      </div>

      <div className="panel-analytics-grid">
        <div className="panel-analytics-block">
          <h3>Top productos vendidos</h3>
          {productosVendidos.length === 0 ? (
            <p className="panel-empty">Sin datos de productos vendidos</p>
          ) : (
            <table className="panel-table panel-table--compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Unidades</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {productosVendidos.slice(0, 10).map((p, i) => (
                  <tr key={p._id || i}>
                    <td>{i + 1}</td>
                    <td>{p.nombre || p.producto || 'Sin nombre'}</td>
                    <td>{p.cantidad || p.unidades || 0}</td>
                    <td>{formatMoney(p.ingresos || p.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel-analytics-block">
          <h3>Ventas por día (últimos 7 días)</h3>
          {ventasPorDia.length === 0 ? (
            <p className="panel-empty">Sin datos de ventas por día</p>
          ) : (
            <table className="panel-table panel-table--compact">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ventas</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {ventasPorDia.slice(-7).map((v, i) => (
                  <tr key={i}>
                    <td>{formatFecha(v.fecha || v._id)}</td>
                    <td>{v.cantidad || v.ventas || 0}</td>
                    <td>{formatMoney(v.ingresos || v.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: FINANZAS — Sub-components
// ============================================================

function SubBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerBalance();
        setBalance(data);
      } catch (err) {
        console.error('Error cargando balance:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!balance) return <div className="panel-empty">No se pudo cargar el balance</div>;

  const ingresos = balance.ingresos || balance.totalIngresos || 0;
  const gastos = balance.gastos || balance.totalGastos || 0;
  const neto = balance.neto || balance.balanceNeto || ingresos - gastos;

  return (
    <div className="panel-sub-section">
      <h3>Balance - P&L</h3>
      <div className="panel-cards-grid">
        <Card titulo="Ingresos" valor={formatMoney(ingresos)} icono="📈" />
        <Card titulo="Gastos" valor={formatMoney(gastos)} icono="📉" />
        <Card
          titulo="Balance neto"
          valor={formatMoney(neto)}
          icono={neto >= 0 ? '✅' : '⚠️'}
        />
      </div>

      {balance.desglose && (
        <div className="panel-balance-desglose">
          <h4>Desglose</h4>
          <table className="panel-table panel-table--compact">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(balance.desglose).map(([key, val]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{formatMoney(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubMargenes() {
  const [margenes, setMargenes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerMargenes();
        setMargenes(data);
      } catch (err) {
        console.error('Error cargando márgenes:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!margenes) return <div className="panel-empty">No se pudieron cargar los márgenes</div>;

  const lista = Array.isArray(margenes) ? margenes : (margenes?.productos || margenes?.margenes || []);

  return (
    <div className="panel-sub-section">
      <h3>Márgenes por producto</h3>
      {lista.length === 0 ? (
        <p className="panel-empty">Sin datos de márgenes</p>
      ) : (
        <table className="panel-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio venta</th>
              <th>Costo</th>
              <th>Margen</th>
              <th>Margen %</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m, i) => {
              const margenPct = m.precioVenta > 0
                ? (((m.precioVenta - (m.costo || 0)) / m.precioVenta) * 100).toFixed(1)
                : '0.0';
              return (
                <tr key={m._id || i}>
                  <td>{m.nombre || m.producto || '-'}</td>
                  <td>{formatMoney(m.precioVenta || m.precio)}</td>
                  <td>{formatMoney(m.costo || m.costoUnitario || 0)}</td>
                  <td>{formatMoney((m.precioVenta || m.precio || 0) - (m.costo || m.costoUnitario || 0))}</td>
                  <td>
                    <span className={`panel-margen ${Number(margenPct) >= 30 ? 'panel-margen--bueno' : 'panel-margen--bajo'}`}>
                      {margenPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SubCanales() {
  const [canales, setCanales] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerCanales();
        setCanales(data);
      } catch (err) {
        console.error('Error cargando canales:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <LoadingSpinner />;

  const lista = Array.isArray(canales) ? canales : (canales?.canales || []);

  return (
    <div className="panel-sub-section">
      <h3>Ventas por canal</h3>
      {lista.length === 0 ? (
        <p className="panel-empty">Sin datos de canales</p>
      ) : (
        <div className="panel-canales-grid">
          {lista.map((canal, i) => (
            <div key={i} className="panel-canal-card">
              <h4>{canal.nombre || canal.canal || canal._id || 'Canal'}</h4>
              <p className="panel-canal-ventas">{canal.ventas || canal.cantidad || 0} ventas</p>
              <p className="panel-canal-ingresos">{formatMoney(canal.ingresos || canal.total || 0)}</p>
              {canal.porcentaje !== undefined && (
                <p className="panel-canal-pct">{canal.porcentaje}% del total</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubTendencia() {
  const [tendencia, setTendencia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerTendencia();
        setTendencia(data);
      } catch (err) {
        console.error('Error cargando tendencia:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <LoadingSpinner />;

  const datos = Array.isArray(tendencia) ? tendencia : (tendencia?.datos || tendencia?.tendencia || []);

  return (
    <div className="panel-sub-section">
      <h3>Tendencia de ventas</h3>
      {datos.length === 0 ? (
        <p className="panel-empty">Sin datos de tendencia</p>
      ) : (
        <table className="panel-table panel-table--compact">
          <thead>
            <tr>
              <th>Período</th>
              <th>Ventas</th>
              <th>Ingresos</th>
              <th>Variación</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((t, i) => (
              <tr key={i}>
                <td>{t.periodo || t.mes || t._id || '-'}</td>
                <td>{t.ventas || t.cantidad || 0}</td>
                <td>{formatMoney(t.ingresos || t.total || 0)}</td>
                <td>
                  {t.variacion !== undefined ? (
                    <span className={t.variacion >= 0 ? 'panel-tendencia--up' : 'panel-tendencia--down'}>
                      {t.variacion >= 0 ? '▲' : '▼'} {Math.abs(t.variacion)}%
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SubConfigMP() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    publicKey: '',
    accessToken: '',
    comision: '',
    activo: false
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerConfiguracion();
        setConfig(data);
        setForm({
          publicKey: data?.mercadopago?.publicKey || data?.publicKey || '',
          accessToken: data?.mercadopago?.accessToken || data?.accessToken || '',
          comision: data?.mercadopago?.comision || data?.comision || '',
          activo: data?.mercadopago?.activo ?? data?.activo ?? false
        });
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleGuardar = async () => {
    try {
      setSaving(true);
      await actualizarConfiguracion({
        mercadopago: {
          publicKey: form.publicKey,
          accessToken: form.accessToken,
          comision: Number(form.comision) || 0,
          activo: form.activo
        }
      });
      alert('Configuración guardada correctamente');
    } catch (err) {
      console.error('Error guardando configuración:', err);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="panel-sub-section">
      <h3>Configuración MercadoPago</h3>
      <div className="panel-form">
        <div className="panel-form__group">
          <label>Public Key</label>
          <input
            type="text"
            value={form.publicKey}
            onChange={e => setForm(f => ({ ...f, publicKey: e.target.value }))}
            placeholder="APP_USR-xxxx..."
          />
        </div>
        <div className="panel-form__group">
          <label>Access Token</label>
          <input
            type="password"
            value={form.accessToken}
            onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
            placeholder="APP_USR-xxxx..."
          />
        </div>
        <div className="panel-form__group">
          <label>Comisión (%)</label>
          <input
            type="number"
            step="0.1"
            value={form.comision}
            onChange={e => setForm(f => ({ ...f, comision: e.target.value }))}
            placeholder="Ej: 4.5"
          />
        </div>
        <div className="panel-form__group panel-form__group--check">
          <label>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
            />
            MercadoPago activo
          </label>
        </div>
        <button
          className="panel-btn panel-btn--primary"
          onClick={handleGuardar}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}

function SubStock() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerTodosProductos();
        setProductos(Array.isArray(data) ? data : (data?.productos || []));
      } catch (err) {
        console.error('Error cargando productos:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalProductos = productos.length;
  const activos = productos.filter(p => p.activo !== false).length;
  const sinStock = productos.filter(p => p.stock === 0).length;

  return (
    <div className="panel-sub-section">
      <h3>Stock de productos</h3>

      <div className="panel-cards-grid">
        <Card titulo="Total productos" valor={totalProductos} icono="📋" />
        <Card titulo="Productos activos" valor={activos} icono="✅" />
        <Card titulo="Sin stock" valor={sinStock} icono="⚠️" />
      </div>

      <table className="panel-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(p => (
            <tr key={p._id} className={p.stock === 0 ? 'panel-row--sin-stock' : ''}>
              <td>{p.nombre}</td>
              <td>
                <span className={`panel-stock ${p.stock === 0 ? 'panel-stock--agotado' : p.stock <= 5 ? 'panel-stock--bajo' : 'panel-stock--ok'}`}>
                  {p.stock}
                </span>
              </td>
              <td>{formatMoney(p.precio)}</td>
              <td>{p.activo !== false ? 'Activo' : 'Inactivo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubGastos() {
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    categoria: CATEGORIAS_GASTO[0],
    fecha: new Date().toISOString().split('T')[0]
  });

  const cargarGastos = useCallback(async () => {
    try {
      setLoading(true);
      const [gastosData, resumenData] = await Promise.all([
        obtenerGastos(),
        obtenerResumenGastos()
      ]);
      setGastos(Array.isArray(gastosData) ? gastosData : (gastosData?.gastos || []));
      setResumen(resumenData);
    } catch (err) {
      console.error('Error cargando gastos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarGastos(); }, [cargarGastos]);

  const resetForm = () => {
    setForm({
      descripcion: '',
      monto: '',
      categoria: CATEGORIAS_GASTO[0],
      fecha: new Date().toISOString().split('T')[0]
    });
    setEditando(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        descripcion: form.descripcion,
        monto: Number(form.monto),
        categoria: form.categoria,
        fecha: form.fecha
      };
      if (editando) {
        await actualizarGasto(editando, payload);
      } else {
        await crearGasto(payload);
      }
      resetForm();
      cargarGastos();
    } catch (err) {
      console.error('Error guardando gasto:', err);
      alert('Error al guardar el gasto');
    }
  };

  const handleEditar = (gasto) => {
    setForm({
      descripcion: gasto.descripcion || '',
      monto: gasto.monto || '',
      categoria: gasto.categoria || CATEGORIAS_GASTO[0],
      fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().split('T')[0] : ''
    });
    setEditando(gasto._id);
    setShowForm(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    try {
      await eliminarGasto(id);
      cargarGastos();
    } catch (err) {
      console.error('Error eliminando gasto:', err);
      alert('Error al eliminar el gasto');
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalGastos = resumen?.total || gastos.reduce((s, g) => s + (g.monto || 0), 0);

  return (
    <div className="panel-sub-section">
      <div className="panel-section__header">
        <h3>Gastos</h3>
        <button className="panel-btn panel-btn--primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : '+ Nuevo gasto'}
        </button>
      </div>

      <Card titulo="Total gastos" valor={formatMoney(totalGastos)} icono="💸" />

      {resumen?.porCategoria && (
        <div className="panel-gastos-categorias">
          {Object.entries(resumen.porCategoria).map(([cat, monto]) => (
            <div key={cat} className="panel-gasto-cat">
              <span>{cat}</span>
              <span>{formatMoney(monto)}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form className="panel-form panel-form--inline" onSubmit={handleSubmit}>
          <div className="panel-form__group">
            <label>Descripción</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              required
            />
          </div>
          <div className="panel-form__group">
            <label>Monto</label>
            <input
              type="number"
              step="0.01"
              value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
              required
            />
          </div>
          <div className="panel-form__group">
            <label>Categoría</label>
            <select
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
            >
              {CATEGORIAS_GASTO.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="panel-form__group">
            <label>Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            />
          </div>
          <button type="submit" className="panel-btn panel-btn--primary">
            {editando ? 'Actualizar' : 'Guardar'}
          </button>
        </form>
      )}

      {gastos.length === 0 ? (
        <p className="panel-empty">No hay gastos registrados</p>
      ) : (
        <table className="panel-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map(g => (
              <tr key={g._id}>
                <td>{g.descripcion}</td>
                <td>{formatMoney(g.monto)}</td>
                <td>{g.categoria}</td>
                <td>{formatFecha(g.fecha)}</td>
                <td>
                  <button className="panel-btn-icon" onClick={() => handleEditar(g)} title="Editar">✏️</button>
                  <button className="panel-btn-icon" onClick={() => handleEliminar(g._id)} title="Eliminar">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SubCampanas() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [resultados, setResultados] = useState({});
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    presupuesto: '',
    plataforma: 'Instagram',
    fechaInicio: '',
    fechaFin: '',
    estado: 'activa'
  });

  const cargarCampanas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await obtenerCampanas();
      const lista = Array.isArray(data) ? data : (data?.campanas || []);
      setCampanas(lista);

      const resMap = {};
      for (const c of lista) {
        try {
          const res = await obtenerResultadosCampana(c._id);
          resMap[c._id] = res;
        } catch { /* ignore */ }
      }
      setResultados(resMap);
    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarCampanas(); }, [cargarCampanas]);

  const resetForm = () => {
    setForm({
      nombre: '', descripcion: '', presupuesto: '',
      plataforma: 'Instagram', fechaInicio: '', fechaFin: '', estado: 'activa'
    });
    setEditando(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        presupuesto: Number(form.presupuesto),
        plataforma: form.plataforma,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        estado: form.estado
      };
      if (editando) {
        await actualizarCampana(editando, payload);
      } else {
        await crearCampana(payload);
      }
      resetForm();
      cargarCampanas();
    } catch (err) {
      console.error('Error guardando campaña:', err);
      alert('Error al guardar la campaña');
    }
  };

  const handleEditar = async (id) => {
    try {
      const data = await obtenerCampana(id);
      const c = data?.campana || data;
      setForm({
        nombre: c.nombre || '',
        descripcion: c.descripcion || '',
        presupuesto: c.presupuesto || '',
        plataforma: c.plataforma || 'Instagram',
        fechaInicio: c.fechaInicio ? new Date(c.fechaInicio).toISOString().split('T')[0] : '',
        fechaFin: c.fechaFin ? new Date(c.fechaFin).toISOString().split('T')[0] : '',
        estado: c.estado || 'activa'
      });
      setEditando(id);
      setShowForm(true);
    } catch (err) {
      console.error('Error cargando campaña:', err);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta campaña?')) return;
    try {
      await eliminarCampana(id);
      cargarCampanas();
    } catch (err) {
      console.error('Error eliminando campaña:', err);
      alert('Error al eliminar la campaña');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="panel-sub-section">
      <div className="panel-section__header">
        <h3>Campañas de marketing</h3>
        <button className="panel-btn panel-btn--primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : '+ Nueva campaña'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="panel-form__row">
            <div className="panel-form__group">
              <label>Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="panel-form__group">
              <label>Plataforma</label>
              <select value={form.plataforma} onChange={e => setForm(f => ({ ...f, plataforma: e.target.value }))}>
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Google Ads</option>
                <option>TikTok</option>
                <option>WhatsApp</option>
                <option>Otra</option>
              </select>
            </div>
          </div>
          <div className="panel-form__group">
            <label>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="panel-form__row">
            <div className="panel-form__group">
              <label>Presupuesto</label>
              <input
                type="number"
                step="0.01"
                value={form.presupuesto}
                onChange={e => setForm(f => ({ ...f, presupuesto: e.target.value }))}
                required
              />
            </div>
            <div className="panel-form__group">
              <label>Fecha inicio</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
              />
            </div>
            <div className="panel-form__group">
              <label>Fecha fin</label>
              <input
                type="date"
                value={form.fechaFin}
                onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
              />
            </div>
            <div className="panel-form__group">
              <label>Estado</label>
              <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div>
          <button type="submit" className="panel-btn panel-btn--primary">
            {editando ? 'Actualizar' : 'Crear campaña'}
          </button>
        </form>
      )}

      {campanas.length === 0 ? (
        <p className="panel-empty">No hay campañas registradas</p>
      ) : (
        <table className="panel-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Plataforma</th>
              <th>Presupuesto</th>
              <th>Estado</th>
              <th>ROI</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campanas.map(c => {
              const res = resultados[c._id];
              const roi = res?.roi || res?.retorno || null;
              return (
                <tr key={c._id}>
                  <td>
                    <div>
                      <strong>{c.nombre}</strong>
                      {c.descripcion && <small style={{ display: 'block', color: '#888' }}>{c.descripcion}</small>}
                    </div>
                  </td>
                  <td>{c.plataforma}</td>
                  <td>{formatMoney(c.presupuesto)}</td>
                  <td>
                    <span className={`panel-badge panel-badge--campana-${c.estado}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td>{roi !== null ? `${roi}%` : '-'}</td>
                  <td>
                    <button className="panel-btn-icon" onClick={() => handleEditar(c._id)} title="Editar">✏️</button>
                    <button className="panel-btn-icon" onClick={() => handleEliminar(c._id)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SubVentaManual() {
  return (
    <div className="panel-sub-section">
      <h3>Venta manual</h3>
      <p>Registrá una venta que se realizó por fuera de la plataforma (presencial, WhatsApp, etc.)</p>
      <Link to="/admin/venta-manual" className="panel-btn panel-btn--primary">
        Ir a formulario de venta manual
      </Link>
    </div>
  );
}

// ============================================================
// TAB: FINANZAS — Main container with sub-tabs
// ============================================================

const FINANZAS_SUBTABS = [
  { key: 'balance', label: 'Balance' },
  { key: 'margenes', label: 'Márgenes' },
  { key: 'canales', label: 'Canales' },
  { key: 'tendencia', label: 'Tendencia' },
  { key: 'stock', label: 'Stock' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'campanas', label: 'Campañas' },
  { key: 'venta-manual', label: 'Venta Manual' },
  { key: 'config-mp', label: 'Config MP' },
];

function TabFinanzas() {
  const [subTab, setSubTab] = useState('balance');

  const renderSubTab = () => {
    switch (subTab) {
      case 'balance': return <SubBalance />;
      case 'margenes': return <SubMargenes />;
      case 'canales': return <SubCanales />;
      case 'tendencia': return <SubTendencia />;
      case 'stock': return <SubStock />;
      case 'gastos': return <SubGastos />;
      case 'campanas': return <SubCampanas />;
      case 'venta-manual': return <SubVentaManual />;
      case 'config-mp': return <SubConfigMP />;
      default: return <SubBalance />;
    }
  };

  return (
    <div className="panel-section">
      <h2>Finanzas</h2>
      <div className="panel-subtabs">
        {FINANZAS_SUBTABS.map(st => (
          <button
            key={st.key}
            className={`panel-subtab-btn ${subTab === st.key ? 'panel-subtab-btn--active' : ''}`}
            onClick={() => setSubTab(st.key)}
          >
            {st.label}
          </button>
        ))}
      </div>
      <div className="panel-subtab-content">
        {renderSubTab()}
      </div>
    </div>
  );
}

// ============================================================
// MAIN: PANEL ADMIN
// ============================================================

const TABS = [
  { key: 'ordenes', label: 'Órdenes' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'finanzas', label: 'Finanzas' },
];

function PanelAdmin() {
  const [activeTab, setActiveTab] = useState('ordenes');

  const renderTab = () => {
    switch (activeTab) {
      case 'ordenes': return <TabOrdenes />;
      case 'analytics': return <TabAnalytics />;
      case 'finanzas': return <TabFinanzas />;
      default: return <TabOrdenes />;
    }
  };

  return (
    <div className="panel-admin">
      <header className="panel-header">
        <div className="panel-header__left">
          <Link to="/" className="panel-header__volver">
            ← Volver a la tienda
          </Link>
          <h1 className="panel-header__titulo">Panel Administrador</h1>
        </div>
      </header>

      <nav className="panel-nav">
        {TABS.map(tab => (
          <TabButton
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </nav>

      <main className="panel-content">
        {renderTab()}
      </main>
    </div>
  );
}

export default PanelAdmin;
