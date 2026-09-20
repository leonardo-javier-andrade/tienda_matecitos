import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerBalance,
  obtenerMargenes,
  obtenerTendencia,
  obtenerCanales,
  obtenerConfiguracion,
  actualizarConfiguracion,
} from '../../services/api';
import './Finanzas.css';

const MESES_NOMBRE = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function Finanzas() {
  const [tab, setTab] = useState('balance');
  const [cargando, setCargando] = useState(true);

  // Periodo
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
  const [desde, setDesde] = useState(inicioMes);
  const [hasta, setHasta] = useState(finMes);

  // Datos
  const [balance, setBalance] = useState(null);
  const [margenes, setMargenes] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [canales, setCanales] = useState(null);
  const [config, setConfig] = useState({ comisionMP: 5.99, ivaComision: 21 });
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  const formatMoney = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

  const cargarBalance = async () => {
    setCargando(true);
    try {
      const res = await obtenerBalance({ desde, hasta });
      if (res.exito) setBalance(res.datos);
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  const cargarMargenes = async () => {
    setCargando(true);
    try {
      const res = await obtenerMargenes({ desde, hasta });
      if (res.exito) setMargenes(res.datos);
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  const cargarTendencia = async () => {
    setCargando(true);
    try {
      const res = await obtenerTendencia(6);
      if (res.exito) setTendencia(res.datos);
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  const cargarCanales = async () => {
    setCargando(true);
    try {
      const res = await obtenerCanales({ desde, hasta });
      if (res.exito) setCanales(res.datos);
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  const cargarConfig = async () => {
    try {
      const res = await obtenerConfiguracion();
      if (res.exito && res.datos) {
        setConfig({ comisionMP: res.datos.comisionMP, ivaComision: res.datos.ivaComision });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    cargarConfig();
  }, []);

  useEffect(() => {
    if (tab === 'balance') cargarBalance();
    else if (tab === 'margenes') cargarMargenes();
    else if (tab === 'tendencia') cargarTendencia();
    else if (tab === 'canales') cargarCanales();
  }, [tab, desde, hasta]);

  const guardarConfig = async () => {
    setGuardandoConfig(true);
    try {
      await actualizarConfiguracion(config);
    } catch (e) { console.error(e); }
    setGuardandoConfig(false);
  };

  const setPeriodoRapido = (tipo) => {
    const h = new Date();
    if (tipo === 'esteMes') {
      setDesde(new Date(h.getFullYear(), h.getMonth(), 1).toISOString().split('T')[0]);
      setHasta(new Date(h.getFullYear(), h.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (tipo === 'mesAnterior') {
      setDesde(new Date(h.getFullYear(), h.getMonth() - 1, 1).toISOString().split('T')[0]);
      setHasta(new Date(h.getFullYear(), h.getMonth(), 0).toISOString().split('T')[0]);
    } else if (tipo === 'esteAnio') {
      setDesde(new Date(h.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setHasta(new Date(h.getFullYear(), 11, 31).toISOString().split('T')[0]);
    }
  };

  return (
    <div className="finanzas-page">
      <div className="finanzas-header">
        <h1>Finanzas</h1>
        <div className="finanzas-header-btns">
          <Link to="/admin" className="finanzas-btn-volver">← Panel</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="finanzas-tabs">
        {[
          { key: 'balance', label: 'Balance' },
          { key: 'margenes', label: 'Margenes' },
          { key: 'canales', label: 'Canales' },
          { key: 'tendencia', label: 'Tendencia' },
          { key: 'config', label: 'Config MP' },
        ].map((t) => (
          <button
            key={t.key}
            className={`finanzas-tab ${tab === t.key ? 'activo' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Periodo (no en tendencia ni config) */}
      {!['tendencia', 'config'].includes(tab) && (
        <div className="finanzas-periodo">
          <select onChange={(e) => setPeriodoRapido(e.target.value)} defaultValue="">
            <option value="" disabled>Periodo rapido</option>
            <option value="esteMes">Este mes</option>
            <option value="mesAnterior">Mes anterior</option>
            <option value="esteAnio">Este año</option>
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      )}

      {cargando && tab !== 'config' ? (
        <p style={{ textAlign: 'center', color: '#b2bec3' }}>Cargando...</p>
      ) : (
        <>
          {/* TAB BALANCE */}
          {tab === 'balance' && balance && (
            <>
              <div className="finanzas-cards">
                <div className="finanzas-card">
                  <span className="finanzas-card-monto ingreso">{formatMoney(balance.ingresos.neto)}</span>
                  <span className="finanzas-card-label">Ingresos netos</span>
                </div>
                <div className="finanzas-card">
                  <span className="finanzas-card-monto gasto">{formatMoney(balance.costos.total)}</span>
                  <span className="finanzas-card-label">Costos totales</span>
                </div>
                <div className="finanzas-card">
                  <span className="finanzas-card-monto ganancia">{formatMoney(balance.resultado.gananciaNeta)}</span>
                  <span className="finanzas-card-label">Ganancia neta</span>
                </div>
                <div className="finanzas-card">
                  <span className="finanzas-card-monto neutro">{balance.resultado.margen}%</span>
                  <span className="finanzas-card-label">Margen</span>
                </div>
              </div>

              <div className="finanzas-desglose">
                <h3>Desglose de costos</h3>
                <div className="finanzas-desglose-item">
                  <span>Costo de productos</span>
                  <span>{formatMoney(balance.costos.productos)}</span>
                </div>
                <div className="finanzas-desglose-item">
                  <span>Comisiones MercadoPago</span>
                  <span>{formatMoney(balance.costos.comisionesMP)}</span>
                </div>
                <div className="finanzas-desglose-item">
                  <span>Gastos operativos</span>
                  <span>{formatMoney(balance.costos.gastosOperativos)}</span>
                </div>
                {balance.costos.detalleGastos?.map((g) => (
                  <div className="finanzas-desglose-item" key={g._id} style={{ paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{g._id?.replace('_', ' ')}</span>
                    <span>{formatMoney(g.total)}</span>
                  </div>
                ))}
                <div className="finanzas-desglose-item" style={{ fontWeight: 700, borderTop: '2px solid #dfe6e9', paddingTop: '0.75rem' }}>
                  <span>Ventas: {balance.ingresos.cantidadVentas}</span>
                  <span>Ganancia bruta: {formatMoney(balance.resultado.gananciaBruta)}</span>
                </div>
              </div>
            </>
          )}

          {/* TAB MARGENES */}
          {tab === 'margenes' && margenes && (
            <>
              {margenes.alertas?.productosSinCosto?.length > 0 && (
                <div style={{ background: '#ffeaa7', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  ⚠️ {margenes.alertas.productosSinCosto.length} producto(s) sin costo unitario cargado:
                  {' '}{margenes.alertas.productosSinCosto.map((p) => p.nombre).join(', ')}
                </div>
              )}

              <div className="finanzas-tabla-wrap">
                <table className="finanzas-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio venta</th>
                      <th>Costo</th>
                      <th>Margen %</th>
                      <th>Unidades</th>
                      <th>Ganancia</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {margenes.margenes?.map((m) => (
                      <tr key={m.productoId}>
                        <td>{m.nombre}</td>
                        <td>{formatMoney(m.precioVenta)}</td>
                        <td>{formatMoney(m.costoUnitario)}</td>
                        <td style={{ color: m.margenNegativo ? '#d63031' : '#00b894', fontWeight: 600 }}>
                          {m.margenPorcentaje}%
                        </td>
                        <td>{m.unidadesVendidas}</td>
                        <td style={{ fontWeight: 600 }}>{formatMoney(m.gananciaTotal)}</td>
                        <td>
                          {m.sinCosto && <span className="finanzas-alerta sin-costo">Sin costo</span>}
                          {m.margenNegativo && <span className="finanzas-alerta negativo">Negativo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB CANALES */}
          {tab === 'canales' && canales && (
            <div className="finanzas-canales-grid">
              {canales.canales?.map((c) => (
                <div className="finanzas-canal-card" key={c.canal}>
                  <h4>{c.canal}</h4>
                  <div className="finanzas-canal-stat"><span>Ventas</span><span>{c.cantidadVentas}</span></div>
                  <div className="finanzas-canal-stat"><span>Ingresos</span><span>{formatMoney(c.ingreso)}</span></div>
                  <div className="finanzas-canal-stat"><span>Costo productos</span><span>{formatMoney(c.costoProductos)}</span></div>
                  <div className="finanzas-canal-stat"><span>Comision MP</span><span>{formatMoney(c.comisionMP)}</span></div>
                  <div className="finanzas-canal-stat"><span>Ganancia bruta</span><span style={{ color: c.gananciaBruta >= 0 ? '#00b894' : '#d63031' }}>{formatMoney(c.gananciaBruta)}</span></div>
                  <div className="finanzas-canal-stat"><span>Margen</span><span style={{ fontWeight: 700 }}>{c.margen}%</span></div>
                  <div className="finanzas-canal-stat"><span>Ticket promedio</span><span>{formatMoney(c.ticketPromedio)}</span></div>
                </div>
              ))}
              {(!canales.canales || canales.canales.length === 0) && (
                <div className="finanzas-vacio">No hay ventas en este periodo</div>
              )}
            </div>
          )}

          {/* TAB TENDENCIA */}
          {tab === 'tendencia' && (
            tendencia.length === 0 ? (
              <div className="finanzas-vacio">No hay datos de tendencia aun</div>
            ) : (
              <div className="finanzas-tabla-wrap">
                <table className="finanzas-tendencia-tabla">
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Ventas</th>
                      <th>Ingresos</th>
                      <th>Costo prod.</th>
                      <th>Comision MP</th>
                      <th>Gastos op.</th>
                      <th>Ganancia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tendencia.map((t) => (
                      <tr key={`${t.anio}-${t.mes}`}>
                        <td style={{ fontWeight: 600 }}>{MESES_NOMBRE[t.mes]} {t.anio}</td>
                        <td>{t.ventas}</td>
                        <td style={{ color: '#00b894' }}>{formatMoney(t.ingreso)}</td>
                        <td>{formatMoney(t.costoProductos)}</td>
                        <td>{formatMoney(t.comisionesMP)}</td>
                        <td>{formatMoney(t.gastosOperativos)}</td>
                        <td style={{ fontWeight: 700, color: t.ganancia >= 0 ? '#00b894' : '#d63031' }}>
                          {formatMoney(t.ganancia)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TAB CONFIG */}
          {tab === 'config' && (
            <div className="finanzas-config">
              <h3>Configuracion MercadoPago</h3>
              <div className="finanzas-config-grupo">
                <label>Comision MP (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={config.comisionMP}
                  onChange={(e) => setConfig({ ...config, comisionMP: Number(e.target.value) })}
                />
              </div>
              <div className="finanzas-config-grupo">
                <label>IVA sobre comision (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={config.ivaComision}
                  onChange={(e) => setConfig({ ...config, ivaComision: Number(e.target.value) })}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#636e72', margin: '0.75rem 0' }}>
                Comision efectiva: {(config.comisionMP + config.comisionMP * config.ivaComision / 100).toFixed(2)}%
              </p>
              <button className="finanzas-config-btn" onClick={guardarConfig} disabled={guardandoConfig}>
                {guardandoConfig ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Finanzas;
