import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerResumenAnalytics,
  obtenerProductosVendidos,
  obtenerProductosVisitados,
  obtenerMenosVendidos,
  obtenerVentasPorDia,
  enviarInformeEmail,
} from '../../services/api';
import './Analytics.css';

function Analytics() {
  const [resumen, setResumen] = useState(null);
  const [masVendidos, setMasVendidos] = useState([]);
  const [masVisitados, setMasVisitados] = useState([]);
  const [menosVendidos, setMenosVendidos] = useState([]);
  const [ventasDia, setVentasDia] = useState([]);
  const [periodoVentas, setPeriodoVentas] = useState('todo');
  const [cargando, setCargando] = useState(true);
  const [enviandoInforme, setEnviandoInforme] = useState(false);
  const [mensajeInforme, setMensajeInforme] = useState('');
  const [tabActiva, setTabActiva] = useState('vendidos');

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    obtenerProductosVendidos(periodoVentas)
      .then((r) => r.exito && setMasVendidos(r.datos))
      .catch(() => {});
  }, [periodoVentas]);

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [res, vendidos, visitados, menos, ventas] = await Promise.all([
        obtenerResumenAnalytics(),
        obtenerProductosVendidos(),
        obtenerProductosVisitados(),
        obtenerMenosVendidos(),
        obtenerVentasPorDia(30),
      ]);
      if (res.exito) setResumen(res.datos);
      if (vendidos.exito) setMasVendidos(vendidos.datos);
      if (visitados.exito) setMasVisitados(visitados.datos);
      if (menos.exito) setMenosVendidos(menos.datos);
      if (ventas.exito) setVentasDia(ventas.datos);
    } catch (err) {
      console.error('Error cargando analytics:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleEnviarInforme = async () => {
    setEnviandoInforme(true);
    setMensajeInforme('');
    try {
      const res = await enviarInformeEmail();
      setMensajeInforme(res.exito ? 'Informe enviado correctamente' : res.mensaje || 'Error al enviar');
    } catch {
      setMensajeInforme('Error de conexion');
    } finally {
      setEnviandoInforme(false);
      setTimeout(() => setMensajeInforme(''), 4000);
    }
  };

  const formatPrecio = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  // Mini bar chart con CSS
  const maxVenta = ventasDia.length > 0 ? Math.max(...ventasDia.map((d) => d.total)) : 1;

  if (cargando) {
    return (
      <div className="analytics">
        <p className="analytics-cargando">Cargando analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p className="analytics-sub">Control de ventas y productos</p>
        </div>
        <div className="analytics-header-btns">
          <button
            className="analytics-btn-informe"
            onClick={handleEnviarInforme}
            disabled={enviandoInforme}
          >
            {enviandoInforme ? 'Enviando...' : 'Enviar informe por email'}
          </button>
          <Link to="/admin" className="analytics-btn-volver">
            Volver al panel
          </Link>
        </div>
      </header>

      {mensajeInforme && (
        <div className={`analytics-toast ${mensajeInforme.includes('Error') ? 'error' : 'exito'}`}>
          {mensajeInforme}
        </div>
      )}

      {/* KPIs */}
      {resumen && (
        <div className="analytics-kpis">
          <div className="kpi-card kpi-principal">
            <span className="kpi-valor">{formatPrecio(resumen.ingresos.total)}</span>
            <span className="kpi-label">Ingresos totales</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-valor">{formatPrecio(resumen.ingresos.mes)}</span>
            <span className="kpi-label">Este mes</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-valor">{formatPrecio(resumen.ingresos.semana)}</span>
            <span className="kpi-label">Esta semana</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-valor">{resumen.ingresos.ventasTotales}</span>
            <span className="kpi-label">Ventas totales</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-valor">{resumen.ordenes.pendientes}</span>
            <span className="kpi-label">Pendientes</span>
          </div>
          <div className="kpi-card kpi-alerta">
            <span className="kpi-valor">{resumen.productos.sinStock}</span>
            <span className="kpi-label">Sin stock</span>
          </div>
        </div>
      )}

      {/* Chart de ventas por día */}
      {ventasDia.length > 0 && (
        <div className="analytics-seccion">
          <h2>Ventas ultimos 30 dias</h2>
          <div className="chart-barras">
            {ventasDia.map((d) => (
              <div key={d._id} className="chart-barra-col">
                <div
                  className="chart-barra"
                  style={{ height: `${Math.max((d.total / maxVenta) * 100, 4)}%` }}
                  title={`${d._id}: ${formatPrecio(d.total)} (${d.cantidad} ventas)`}
                >
                  <span className="chart-barra-tooltip">
                    {formatPrecio(d.total)}
                    <br />
                    {d.cantidad} venta{d.cantidad !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="chart-barra-label">{d._id.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="analytics-tabs">
        <button
          className={`analytics-tab ${tabActiva === 'vendidos' ? 'activa' : ''}`}
          onClick={() => setTabActiva('vendidos')}
        >
          Mas vendidos
        </button>
        <button
          className={`analytics-tab ${tabActiva === 'visitados' ? 'activa' : ''}`}
          onClick={() => setTabActiva('visitados')}
        >
          Mas visitados
        </button>
        <button
          className={`analytics-tab ${tabActiva === 'menos' ? 'activa' : ''}`}
          onClick={() => setTabActiva('menos')}
        >
          Menos vendidos
        </button>
      </div>

      {/* Contenido tabs */}
      <div className="analytics-seccion">
        {tabActiva === 'vendidos' && (
          <>
            <div className="analytics-filtro-periodo">
              {['todo', 'mes', 'semana'].map((p) => (
                <button
                  key={p}
                  className={`periodo-btn ${periodoVentas === p ? 'activo' : ''}`}
                  onClick={() => setPeriodoVentas(p)}
                >
                  {p === 'todo' ? 'Todo' : p === 'mes' ? 'Ultimo mes' : 'Ultima semana'}
                </button>
              ))}
            </div>
            <div className="analytics-lista">
              {masVendidos.length === 0 ? (
                <p className="analytics-vacio">Sin datos de ventas todavia</p>
              ) : (
                masVendidos.map((p, i) => (
                  <div key={p._id} className="analytics-item">
                    <span className="item-rank">#{i + 1}</span>
                    <div className="item-thumb">
                      {p.imagen ? <img src={p.imagen} alt="" /> : <span>🧉</span>}
                    </div>
                    <div className="item-info">
                      <span className="item-nombre">{p.nombre}</span>
                      <span className="item-meta">
                        {p.cantidadVendida} vendido{p.cantidadVendida !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="item-valor">{formatPrecio(p.ingresoTotal)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tabActiva === 'visitados' && (
          <div className="analytics-lista">
            {masVisitados.length === 0 ? (
              <p className="analytics-vacio">Sin datos de visitas todavia</p>
            ) : (
              masVisitados.map((p, i) => (
                <div key={p._id} className="analytics-item">
                  <span className="item-rank">#{i + 1}</span>
                  <div className="item-thumb">
                    {p.imagen ? <img src={p.imagen} alt="" /> : <span>🧉</span>}
                  </div>
                  <div className="item-info">
                    <span className="item-nombre">{p.nombre}</span>
                    <span className="item-meta">{p.categoria}</span>
                  </div>
                  <div className="item-stats">
                    <span className="item-valor">{p.visitas} visitas</span>
                    <span className="item-sub">{formatPrecio(p.precio)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tabActiva === 'menos' && (
          <div className="analytics-lista">
            {menosVendidos.length === 0 ? (
              <p className="analytics-vacio">Sin datos todavia</p>
            ) : (
              menosVendidos.map((p, i) => (
                <div key={p._id} className="analytics-item">
                  <span className="item-rank">#{i + 1}</span>
                  <div className="item-thumb">
                    {p.imagen ? <img src={p.imagen} alt="" /> : <span>🧉</span>}
                  </div>
                  <div className="item-info">
                    <span className="item-nombre">{p.nombre}</span>
                    <span className="item-meta">Stock: {p.stock}</span>
                  </div>
                  <div className="item-stats">
                    <span className="item-valor">{p.cantidadVendida} vendidos</span>
                    <span className="item-sub">{formatPrecio(p.precio)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
