import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerResumenDashboard,
  obtenerDesgloseDashboard,
  obtenerAlertasStock,
  obtenerLogistica,
  actualizarDespacho,
  marcarLogisticaPagada,
  obtenerTopProductos,
  obtenerStockDashboard,
  registrarVentaManualDashboard,
  obtenerVentasPeriodo,
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerTodosProductos,
  obtenerTodasCategorias,
} from '../../services/api';
import './PanelAdmin.css';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

const fmtFecha = (f) => {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

/* ─── KPI Card ────────────────────────────────────── */

function KpiCard({ label, sublabel, valor, icon, destacada, badge }) {
  return (
    <div className={`da-kpi-card${destacada ? ' destacada' : ''}`}>
      {icon && <span className="da-kpi-icon">{icon}</span>}
      <p className="da-kpi-label">{label}</p>
      {sublabel && <p className="da-kpi-sublabel">{sublabel}</p>}
      <p className="da-kpi-valor">{valor}</p>
      {badge && <span className="da-kpi-badge">{badge}</span>}
    </div>
  );
}

/* ─── Donut Chart (CSS conic-gradient) ────────────── */

function DonutChart({ segmentos, total }) {
  const colores = ['#c9a96e', '#60a5fa', '#fb923c', '#f87171', '#4ade80', '#a78bfa'];
  let acum = 0;
  const stops = segmentos.map((s, i) => {
    const pct = total > 0 ? (s.valor / total) * 100 : 0;
    const from = acum;
    acum += pct;
    return `${colores[i % colores.length]} ${from}% ${acum}%`;
  });
  const bg = stops.length > 0
    ? `conic-gradient(${stops.join(', ')})`
    : 'conic-gradient(#2a2623 0% 100%)';

  return (
    <div className="da-donut-wrap">
      <div className="da-donut" style={{ background: bg }}>
        <div className="da-donut-hole">
          <span className="da-donut-total">{fmtMoney(total)}</span>
          <span className="da-donut-total-label">Total</span>
        </div>
      </div>
      <div className="da-leyenda">
        {segmentos.map((s, i) => (
          <div key={i} className="da-leyenda-item">
            <span className="da-leyenda-dot" style={{ background: colores[i % colores.length] }} />
            <span>{s.label}</span>
            <span className="da-leyenda-valor">{fmtMoney(s.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bar Chart ───────────────────────────────────── */

function BarChart({ datos }) {
  if (!datos || datos.length === 0) return <p className="da-vacio">Sin datos de ventas</p>;
  const max = Math.max(...datos.map((d) => d.total || 0), 1);
  return (
    <div className="da-chart-barras">
      {datos.map((d, i) => {
        const h = ((d.total || 0) / max) * 100;
        return (
          <div key={i} className="da-barra" style={{ height: `${Math.max(h, 2)}%` }}>
            <div className="da-barra-tooltip">
              {fmtFecha(d._id || d.fecha)}: {fmtMoney(d.total)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Alertas Stock ───────────────────────────────── */

function AlertasStock({ alertas }) {
  if (!alertas || alertas.length === 0)
    return <p style={{ fontSize: '0.8rem', color: 'var(--dash-text-dim)' }}>Sin alertas de stock</p>;
  return (
    <div className="da-alertas-lista">
      {alertas.map((a) => (
        <div key={a._id} className="da-alerta-item">
          {a.imagenes?.[0]?.url ? (
            <img className="da-alerta-thumb" src={a.imagenes[0].url} alt="" />
          ) : (
            <div className="da-alerta-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              🧉
            </div>
          )}
          <div className="da-alerta-info">
            <div className="da-alerta-nombre">{a.nombre}</div>
            <div className="da-alerta-badge">
              Stock: {a.stock} / Critico: {a.stockCritico || 3}
            </div>
          </div>
          <div className="da-alerta-datos">
            <div className="da-alerta-costo">Costo: {fmtMoney(a.costoUnitario)}</div>
            <div className="da-alerta-precio">{fmtMoney(a.precio)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Top Productos ───────────────────────────────── */

function TopProductos({ lista }) {
  if (!lista || lista.length === 0) return <p className="da-vacio">Sin datos</p>;
  return (
    <div className="da-top-lista">
      {lista.map((p, i) => (
        <div key={i} className="da-top-item">
          <span className="da-top-rank">{i + 1}</span>
          <div className="da-top-info">
            <div className="da-top-nombre">{p.nombre || p._id}</div>
            <div className="da-top-cantidad">{p.cantidadVendida || p.cantidad} vendidos</div>
          </div>
          <span className="da-top-ingreso">{fmtMoney(p.ingresos || p.total)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Modal Venta Manual ──────────────────────────── */

function ModalVentaManual({ abierto, onCerrar, onRegistrada }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [items, setItems] = useState([]);
  const [canal, setCanal] = useState('presencial');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const buscadorRef = useRef(null);
  const todosRef = useRef([]);

  useEffect(() => {
    if (abierto) {
      obtenerTodosProductos().then((res) => {
        todosRef.current = res?.datos || res || [];
      });
    }
  }, [abierto]);

  const handleBuscar = (q) => {
    setBusqueda(q);
    if (q.length < 2) { setResultados([]); return; }
    const lower = q.toLowerCase();
    setResultados(
      todosRef.current
        .filter((p) => (p.nombre || '').toLowerCase().includes(lower) || (p.sku || '').toLowerCase().includes(lower))
        .slice(0, 8)
    );
  };

  const agregarItem = (prod) => {
    setBusqueda('');
    setResultados([]);
    const existe = items.find((i) => i.producto === prod._id);
    if (existe) {
      setItems(items.map((i) => (i.producto === prod._id ? { ...i, cantidad: i.cantidad + 1 } : i)));
    } else {
      setItems([...items, {
        producto: prod._id,
        nombre: prod.nombre,
        precio: prod.precio,
        costoUnitario: prod.costoUnitario || 0,
        cantidad: 1,
        stockDisp: prod.stock,
      }]);
    }
  };

  const cambiarCantidad = (idx, cant) => {
    const n = Math.max(1, Math.min(cant, items[idx].stockDisp));
    setItems(items.map((it, i) => (i === idx ? { ...it, cantidad: n } : it)));
  };

  const quitarItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const handleRegistrar = async () => {
    if (items.length === 0) { setError('Agrega al menos un producto'); return; }
    setGuardando(true);
    setError('');
    try {
      await registrarVentaManualDashboard({
        items: items.map((i) => ({ producto: i.producto, cantidad: i.cantidad, precio: i.precio })),
        canal,
        metodoPago,
        notas,
      });
      setItems([]);
      setNotas('');
      onRegistrada();
      onCerrar();
    } catch (err) {
      setError(err?.message || 'Error al registrar la venta');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="da-modal-overlay" onClick={onCerrar}>
      <div className="da-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Registrar Venta Manual</h2>

        <div className="da-buscador-wrap" ref={buscadorRef}>
          <input
            className="da-buscador-input"
            type="text"
            value={busqueda}
            onChange={(e) => handleBuscar(e.target.value)}
            placeholder="Buscar producto por nombre o SKU..."
          />
          {resultados.length > 0 && (
            <div className="da-buscador-resultados">
              {resultados.map((p) => (
                <div key={p._id} className="da-buscador-item" onClick={() => agregarItem(p)}>
                  {p.imagenes?.[0]?.url ? (
                    <img className="da-buscador-item-thumb" src={p.imagenes[0].url} alt="" />
                  ) : (
                    <span style={{ width: 30, textAlign: 'center' }}>🧉</span>
                  )}
                  <div className="da-buscador-item-info">
                    <div className="da-buscador-item-nombre">{p.nombre}</div>
                    <div className="da-buscador-item-stock">Stock: {p.stock} | {fmtMoney(p.precio)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="da-modal-items">
            {items.map((it, idx) => (
              <div key={idx} className="da-modal-item">
                <span className="da-modal-item-nombre">{it.nombre}</span>
                <input
                  className="da-modal-item-cant"
                  type="number"
                  min={1}
                  max={it.stockDisp}
                  value={it.cantidad}
                  onChange={(e) => cambiarCantidad(idx, Number(e.target.value))}
                />
                <span className="da-modal-item-precio">{fmtMoney(it.precio * it.cantidad)}</span>
                <button className="da-modal-item-quitar" onClick={() => quitarItem(idx)}>x</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="da-modal-campo" style={{ flex: 1 }}>
            <label>Canal</label>
            <select value={canal} onChange={(e) => setCanal(e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="da-modal-campo" style={{ flex: 1 }}>
            <label>Metodo de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="da-modal-campo">
          <label>Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: cliente habitual, descuento aplicado..." />
        </div>

        <div className="da-modal-total">
          <span>Total</span>
          <span className="da-modal-total-valor">{fmtMoney(total)}</span>
        </div>

        {error && <p style={{ color: 'var(--dash-red)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</p>}

        <div className="da-modal-acciones">
          <button className="da-btn-cancelar" onClick={onCerrar}>Cancelar</button>
          <button className="da-btn-registrar" onClick={handleRegistrar} disabled={guardando || items.length === 0}>
            {guardando ? 'Registrando...' : 'Registrar venta'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: FINANZAS
   ═══════════════════════════════════════════════════ */

function TabFinanzas() {
  const [resumen, setResumen] = useState(null);
  const [desglose, setDesglose] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [ventasDia, setVentasDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [toast, setToast] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [res, desg, alrt, top, ventas] = await Promise.all([
        obtenerResumenDashboard(),
        obtenerDesgloseDashboard(),
        obtenerAlertasStock(),
        obtenerTopProductos(),
        obtenerVentasPeriodo(30),
      ]);
      setResumen(res?.datos || res);
      setDesglose(desg?.datos || desg);
      setAlertas(alrt?.datos || alrt || []);
      setTopProds(top?.datos || top || []);
      setVentasDia(ventas?.datos || ventas || []);
    } catch (err) {
      console.error('Error cargando finanzas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <p className="da-vacio">Cargando datos financieros...</p>;

  const r = resumen || {};
  const ingresosBrutos = r.ingresosBrutos || r.totalPagado || 0;
  const fondoEnvios = r.fondoEnvios || r.totalEnvios || 0;
  const costoMercaderia = r.costoMercaderia || r.costoTotalProductos || 0;
  const gananciaNeta = r.gananciaNeta || r.gananciaNetaEstimada || 0;
  const comisionesMP = r.comisionesMP || r.totalComisionMP || 0;
  const ivaTotal = r.ivaTotal || 0;
  const totalOrdenes = r.totalOrdenes || r.cantidadOrdenes || 0;

  const segmentosDonut = [];
  if (desglose) {
    if (desglose.costoProductos) segmentosDonut.push({ label: 'Costo Mercaderia', valor: desglose.costoProductos });
    if (desglose.comisionMP) segmentosDonut.push({ label: 'Comision MP', valor: desglose.comisionMP });
    if (desglose.iva) segmentosDonut.push({ label: 'IVA', valor: desglose.iva });
    if (desglose.envios) segmentosDonut.push({ label: 'Envios', valor: desglose.envios });
    if (desglose.ganancia) segmentosDonut.push({ label: 'Ganancia Neta', valor: desglose.ganancia });
  }
  if (segmentosDonut.length === 0) {
    segmentosDonut.push(
      { label: 'Costo Mercaderia', valor: costoMercaderia },
      { label: 'Comision MP', valor: comisionesMP },
      { label: 'Envios', valor: fondoEnvios },
      { label: 'Ganancia Neta', valor: Math.max(0, gananciaNeta) }
    );
  }
  const totalDonut = segmentosDonut.reduce((s, sg) => s + sg.valor, 0);

  return (
    <>
      <div className="da-kpis">
        <KpiCard label="Ingresos Brutos" sublabel={`${totalOrdenes} ordenes`} valor={fmtMoney(ingresosBrutos)} icon="$" />
        <KpiCard label="Fondo de Envios" sublabel="cobrado al cliente" valor={fmtMoney(fondoEnvios)} icon="🚚" />
        <KpiCard label="Costo de Mercaderia" sublabel="precio de compra" valor={fmtMoney(costoMercaderia)} icon="📦" />
        <KpiCard label="Ganancia Neta Estimada" valor={fmtMoney(gananciaNeta)} icon="📈" destacada badge={comisionesMP > 0 ? `MP: ${fmtMoney(comisionesMP)}` : null} />
      </div>

      <div className="da-grid-2">
        <div className="da-panel">
          <div className="da-panel-header">
            <span className="da-panel-icon">📊</span> Desglose de Ingresos
          </div>
          <DonutChart segmentos={segmentosDonut} total={totalDonut || ingresosBrutos} />
        </div>

        <div className="da-panel">
          <div className="da-panel-header">
            <span className="da-panel-icon">⚠️</span> Alertas de Stock
          </div>
          <AlertasStock alertas={alertas} />
        </div>
      </div>

      <div className="da-grid-2">
        <div className="da-panel">
          <div className="da-panel-header">
            <span className="da-panel-icon">📅</span> Ventas ultimos 30 dias
          </div>
          <BarChart datos={ventasDia} />
        </div>

        <div className="da-panel">
          <div className="da-panel-header">
            <span className="da-panel-icon">🏆</span> Top Productos
          </div>
          <TopProductos lista={topProds} />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button className="da-btn-venta-manual" onClick={() => setModalAbierto(true)}>
          + Registrar Venta Manual
        </button>
      </div>

      <ModalVentaManual
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onRegistrada={() => { mostrarToast('Venta registrada con exito'); cargar(); }}
      />

      {toast && <div className="da-toast">{toast}</div>}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: LOGISTICA
   ═══════════════════════════════════════════════════ */

function TabLogistica() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(null);
  const [toast, setToast] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerLogistica();
      setOrdenes(data?.datos || data || []);
    } catch (err) {
      console.error('Error cargando logistica:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDespacho = async (id, nuevoEstado) => {
    setActualizando(id);
    try {
      await actualizarDespacho(id, nuevoEstado);
      setOrdenes((prev) =>
        prev.map((o) => (o._id === id ? { ...o, estadoDespacho: nuevoEstado } : o))
      );
      setToast(`Despacho actualizado a "${nuevoEstado}"`);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setActualizando(null);
    }
  };

  const handlePagada = async (id) => {
    setActualizando(id);
    try {
      await marcarLogisticaPagada(id);
      setOrdenes((prev) =>
        prev.map((o) => (o._id === id ? { ...o, logisticaPagada: true } : o))
      );
      setToast('Logistica marcada como pagada');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setActualizando(null);
    }
  };

  if (loading) return <p className="da-vacio">Cargando logistica...</p>;

  return (
    <>
      <div className="da-panel">
        <div className="da-panel-header">
          <span className="da-panel-icon">🚚</span> Auditoria de Envios y Logistica
        </div>
        {ordenes.length === 0 ? (
          <p className="da-vacio">No hay ordenes pendientes de despacho</p>
        ) : (
          <div className="da-tabla-wrap">
            <table className="da-tabla">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Comprador</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Envio</th>
                  <th>Despacho</th>
                  <th>Logistica</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      #{(o._id || '').slice(-6).toUpperCase()}
                    </td>
                    <td>{o.comprador?.nombre || o.nombreComprador || '-'}</td>
                    <td>
                      {(o.items || []).map((it, i) => (
                        <div key={i} style={{ fontSize: '0.75rem' }}>
                          {it.nombre || it.producto?.nombre || 'Prod'} x{it.cantidad}
                        </div>
                      ))}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(o.total)}</td>
                    <td>{fmtMoney(o.envioCobradoAlCliente || 0)}</td>
                    <td>
                      <span className={`da-estado-badge ${o.estadoDespacho || 'pendiente'}`}>
                        {o.estadoDespacho || 'pendiente'}
                      </span>
                    </td>
                    <td>
                      <span className={`da-estado-badge ${o.logisticaPagada ? 'pagada' : 'no-pagada'}`}>
                        {o.logisticaPagada ? 'Pagada' : 'No pagada'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {(o.estadoDespacho === 'pendiente' || !o.estadoDespacho) && (
                          <button
                            className="da-btn-sm despachar"
                            disabled={actualizando === o._id}
                            onClick={() => handleDespacho(o._id, 'preparando')}
                          >
                            Preparar
                          </button>
                        )}
                        {o.estadoDespacho === 'preparando' && (
                          <button
                            className="da-btn-sm despachar"
                            disabled={actualizando === o._id}
                            onClick={() => handleDespacho(o._id, 'despachado')}
                          >
                            Despachar
                          </button>
                        )}
                        {o.estadoDespacho === 'despachado' && (
                          <button
                            className="da-btn-sm despachar"
                            disabled={actualizando === o._id}
                            onClick={() => handleDespacho(o._id, 'entregado')}
                          >
                            Entregado
                          </button>
                        )}
                        {!o.logisticaPagada && (
                          <button
                            className="da-btn-sm pagada"
                            disabled={actualizando === o._id}
                            onClick={() => handlePagada(o._id)}
                          >
                            Marcar pagada
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="da-toast">{toast}</div>}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: STOCK
   ═══════════════════════════════════════════════════ */

function TabStock() {
  const [productos, setProductos] = useState([]);
  const [kpis, setKpis] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({ categoria: '', tipo: '', buscar: '' });
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerTodasCategorias()
      .then((res) => setCategorias(res?.datos || res || []))
      .catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filtros, pagina, limite: 20 };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const data = await obtenerStockDashboard(params);
      const d = data?.datos || data;
      setProductos(d?.productos || []);
      setKpis(d?.kpis || {});
      setTotalPaginas(d?.totalPaginas || 1);
    } catch (err) {
      console.error('Error cargando stock:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleFiltro = (key, val) => {
    setFiltros((prev) => ({ ...prev, [key]: val }));
    setPagina(1);
  };

  const exportarCSV = () => {
    const header = 'Fecha Ingreso,SKU,Categoria,Tipo,Nombre,Cantidad,Costo Producto,Gasto Envio,Costo Total,Precio Sugerido\n';
    const rows = productos.map((p) =>
      [
        fmtFecha(p.fechaIngreso),
        p.sku || '',
        p.categoria || '',
        p.tipoProducto || '',
        `"${(p.nombre || '').replace(/"/g, '""')}"`,
        p.stock,
        p.costoUnitario || 0,
        p.gastoEnvio || 0,
        (p.costoUnitario || 0) + (p.gastoEnvio || 0),
        p.precioSugerido || p.precio || 0,
      ].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const catNombres = categorias.filter((c) => c.activo).map((c) => c.nombre);

  return (
    <>
      <div className="da-stock-filtros">
        <select value={filtros.categoria} onChange={(e) => handleFiltro('categoria', e.target.value)}>
          <option value="">Todas las categorias</option>
          {catNombres.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtros.tipo} onChange={(e) => handleFiltro('tipo', e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="mate">Mate</option>
          <option value="bombilla">Bombilla</option>
          <option value="accesorio">Accesorio</option>
          <option value="kit">Kit</option>
          <option value="otro">Otro</option>
        </select>
        <input
          type="text"
          value={filtros.buscar}
          onChange={(e) => handleFiltro('buscar', e.target.value)}
          placeholder="Buscar por nombre o SKU..."
        />
        <button className="da-btn-exportar" onClick={exportarCSV}>Exportar CSV</button>
      </div>

      <div className="da-stock-kpis">
        <div className="da-stock-kpi">
          <div className="da-stock-kpi-valor">{kpis.totalArticulos || productos.length}</div>
          <div className="da-stock-kpi-label">Total articulos</div>
        </div>
        <div className="da-stock-kpi">
          <div className="da-stock-kpi-valor">{fmtMoney(kpis.capitalInvertido || 0)}</div>
          <div className="da-stock-kpi-label">Capital invertido</div>
        </div>
        <div className="da-stock-kpi">
          <div className="da-stock-kpi-valor">{fmtMoney(kpis.costosLogistica || 0)}</div>
          <div className="da-stock-kpi-label">Costos logistica</div>
        </div>
        <div className="da-stock-kpi">
          <div className="da-stock-kpi-valor">{fmtMoney(kpis.valorVentaPotencial || 0)}</div>
          <div className="da-stock-kpi-label">Valor venta potencial</div>
        </div>
      </div>

      {loading ? (
        <p className="da-vacio">Cargando stock...</p>
      ) : (
        <div className="da-panel">
          <div className="da-tabla-wrap">
            <table className="da-tabla">
              <thead>
                <tr>
                  <th>Fecha Ingreso</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Cant.</th>
                  <th>Costo Prod.</th>
                  <th>Gasto Envio</th>
                  <th>Costo Total</th>
                  <th>P. Sugerido</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const costoTotal = (p.costoUnitario || 0) + (p.gastoEnvio || 0);
                  return (
                    <tr key={p._id}>
                      <td>{fmtFecha(p.fechaIngreso)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.sku || '-'}</td>
                      <td>{p.categoria || '-'}</td>
                      <td>{p.tipoProducto || '-'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--dash-text)' }}>{p.nombre}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          color: p.stock === 0 ? 'var(--dash-red)' : p.stock <= (p.stockCritico || 3) ? 'var(--dash-orange)' : 'var(--dash-green)',
                          fontWeight: 700,
                        }}>
                          {p.stock}
                        </span>
                      </td>
                      <td>{fmtMoney(p.costoUnitario)}</td>
                      <td>{fmtMoney(p.gastoEnvio)}</td>
                      <td style={{ fontWeight: 600 }}>{fmtMoney(costoTotal)}</td>
                      <td style={{ color: 'var(--dash-accent)' }}>{fmtMoney(p.precioSugerido || 0)}</td>
                      <td>{fmtMoney(p.precio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                className="da-btn-sm despachar"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', alignSelf: 'center' }}>
                {pagina} / {totalPaginas}
              </span>
              <button
                className="da-btn-sm despachar"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: CONFIG
   ═══════════════════════════════════════════════════ */

function TabConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    comisionMP: 5.99,
    ivaComision: 21,
    aplicarIva: false,
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerConfiguracion();
        const c = data?.datos || data;
        setConfig(c);
        setForm({
          comisionMP: c?.comisionMP ?? 5.99,
          ivaComision: c?.ivaComision ?? 21,
          aplicarIva: c?.aplicarIva ?? false,
        });
      } catch (err) {
        console.error('Error cargando config:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await actualizarConfiguracion({
        comisionMP: Number(form.comisionMP),
        ivaComision: Number(form.ivaComision),
        aplicarIva: form.aplicarIva,
      });
      setToast('Configuracion guardada');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuracion');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <p className="da-vacio">Cargando configuracion...</p>;

  return (
    <>
      <div className="da-panel">
        <div className="da-panel-header">
          <span className="da-panel-icon">⚙️</span> Configuracion Financiera
        </div>
        <div className="da-config-grid">
          <div className="da-config-campo">
            <label>Comision MercadoPago (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.comisionMP}
              onChange={(e) => setForm((f) => ({ ...f, comisionMP: e.target.value }))}
            />
          </div>
          <div className="da-config-campo">
            <label>IVA sobre comision (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.ivaComision}
              onChange={(e) => setForm((f) => ({ ...f, ivaComision: e.target.value }))}
            />
          </div>
          <div className="da-config-check">
            <input
              type="checkbox"
              id="aplicarIva"
              checked={form.aplicarIva}
              onChange={(e) => setForm((f) => ({ ...f, aplicarIva: e.target.checked }))}
            />
            <label htmlFor="aplicarIva">Aplicar IVA a la comision de MP</label>
          </div>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--dash-text-dim)' }}>
          La comision se calcula sobre el total pagado por el cliente. Si "Aplicar IVA" esta activo,
          se suma {form.ivaComision}% sobre la comision base.
          <br />
          Comision efectiva: {form.aplicarIva
            ? `${form.comisionMP}% + ${form.ivaComision}% IVA = ${(Number(form.comisionMP) * (1 + Number(form.ivaComision) / 100)).toFixed(2)}%`
            : `${form.comisionMP}%`
          }
        </p>

        <button className="da-btn-guardar" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
      {toast && <div className="da-toast">{toast}</div>}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN: PANEL ADMIN
   ═══════════════════════════════════════════════════ */

const TABS = [
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'logistica', label: 'Logistica' },
  { key: 'stock', label: 'Stock' },
  { key: 'config', label: 'Config' },
];

function PanelAdmin() {
  const [tab, setTab] = useState('finanzas');

  const renderTab = () => {
    switch (tab) {
      case 'finanzas': return <TabFinanzas />;
      case 'logistica': return <TabLogistica />;
      case 'stock': return <TabStock />;
      case 'config': return <TabConfig />;
      default: return <TabFinanzas />;
    }
  };

  return (
    <div className="panel-admin">
      <header className="da-header">
        <div className="da-header-izq">
          <Link to="/" className="da-btn-volver">← Tienda</Link>
          <h1>Dashboard Financiero</h1>
        </div>
        <div className="da-header-der">
          <Link to="/admin" className="da-btn-volver">Panel Productos</Link>
        </div>
      </header>

      <nav className="da-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`da-tab${tab === t.key ? ' activo' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="da-contenido">
        {renderTab()}
      </main>
    </div>
  );
}

export default PanelAdmin;
