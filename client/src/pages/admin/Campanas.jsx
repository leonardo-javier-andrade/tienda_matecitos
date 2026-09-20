import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerCampanas,
  crearCampana,
  actualizarCampana,
  eliminarCampana,
  obtenerResultadosCampana,
} from '../../services/api';
import './Campanas.css';

const campanaVacia = {
  nombre: '',
  tipo: 'promocion',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
  presupuesto: '',
};

function Campanas() {
  const [campanas, setCampanas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [campanaActual, setCampanaActual] = useState(campanaVacia);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(null); // resultados de campana
  const [resultados, setResultados] = useState({});

  const formatMoney = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await obtenerCampanas();
      if (res.exito) setCampanas(res.datos || []);
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirNueva = () => {
    setCampanaActual(campanaVacia);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirEditar = (c) => {
    setCampanaActual({
      nombre: c.nombre,
      tipo: c.tipo,
      fechaInicio: c.fechaInicio ? c.fechaInicio.split('T')[0] : '',
      fechaFin: c.fechaFin ? c.fechaFin.split('T')[0] : '',
      descripcion: c.descripcion || '',
      presupuesto: c.presupuesto || '',
    });
    setEditandoId(c._id);
    setModalAbierto(true);
  };

  const handleGuardar = async () => {
    if (!campanaActual.nombre || !campanaActual.tipo || !campanaActual.fechaInicio || !campanaActual.fechaFin) return;
    setGuardando(true);
    try {
      const datos = {
        ...campanaActual,
        presupuesto: Number(campanaActual.presupuesto) || 0,
      };
      const res = editandoId
        ? await actualizarCampana(editandoId, datos)
        : await crearCampana(datos);

      if (res.exito) {
        setModalAbierto(false);
        cargarDatos();
      }
    } catch (e) { console.error(e); }
    setGuardando(false);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta campaña?')) return;
    try {
      const res = await eliminarCampana(id);
      if (res.exito) cargarDatos();
    } catch (e) { console.error(e); }
  };

  const verResultados = async (id) => {
    if (detalleAbierto === id) {
      setDetalleAbierto(null);
      return;
    }
    try {
      const res = await obtenerResultadosCampana(id);
      if (res.exito) {
        setResultados((prev) => ({ ...prev, [id]: res.datos }));
        setDetalleAbierto(id);
      }
    } catch (e) { console.error(e); }
  };

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-AR') : '-';

  return (
    <div className="campanas-page">
      <div className="campanas-header">
        <h1>Campañas</h1>
        <div className="campanas-header-btns">
          <Link to="/admin" className="campanas-btn-volver">← Panel</Link>
          <button className="campanas-btn-nueva" onClick={abrirNueva}>+ Nueva Campaña</button>
        </div>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#b2bec3' }}>Cargando...</p>
      ) : campanas.length === 0 ? (
        <div className="campanas-vacio">
          <p>No hay campañas registradas</p>
          <button className="campanas-btn-nueva" onClick={abrirNueva}>Crear primera campaña</button>
        </div>
      ) : (
        <div className="campanas-grid">
          {campanas.map((c) => (
            <div key={c._id} className="campana-card">
              <div className="campana-card-header">
                <h3>{c.nombre}</h3>
                <span className={`campana-tipo-badge ${c.tipo}`}>{c.tipo}</span>
              </div>
              <div className="campana-fechas">
                {formatFecha(c.fechaInicio)} — {formatFecha(c.fechaFin)}
              </div>
              {c.descripcion && <div className="campana-desc">{c.descripcion}</div>}

              {detalleAbierto === c._id && resultados[c._id] && (
                <div className="campana-detalle-cards">
                  <div className="campana-detalle-card">
                    <span className="valor">{resultados[c._id].resultados.cantidadVentas}</span>
                    <span className="label">Ventas</span>
                  </div>
                  <div className="campana-detalle-card">
                    <span className="valor" style={{ color: '#00b894', fontSize: '0.95rem' }}>{formatMoney(resultados[c._id].resultados.ingresoTotal)}</span>
                    <span className="label">Ingresos</span>
                  </div>
                  <div className="campana-detalle-card">
                    <span className="valor" style={{ color: '#d63031', fontSize: '0.95rem' }}>{formatMoney(resultados[c._id].resultados.costosTotales)}</span>
                    <span className="label">Costos</span>
                  </div>
                  <div className="campana-detalle-card">
                    <span className="valor" style={{ color: resultados[c._id].resultados.ganancia >= 0 ? '#00b894' : '#d63031', fontSize: '0.95rem' }}>{formatMoney(resultados[c._id].resultados.ganancia)}</span>
                    <span className="label">Ganancia</span>
                  </div>
                  {resultados[c._id].resultados.roi !== null && (
                    <div className="campana-detalle-card">
                      <span className="valor">{resultados[c._id].resultados.roi}%</span>
                      <span className="label">ROI</span>
                    </div>
                  )}
                  {resultados[c._id].resultados.presupuesto > 0 && (
                    <div className="campana-detalle-card">
                      <span className="valor" style={{ fontSize: '0.95rem' }}>{formatMoney(resultados[c._id].resultados.presupuesto)}</span>
                      <span className="label">Presupuesto</span>
                    </div>
                  )}
                </div>
              )}

              <div className="campana-acciones">
                <button className="campana-btn ver" onClick={() => verResultados(c._id)}>
                  {detalleAbierto === c._id ? 'Ocultar' : 'Ver resultados'}
                </button>
                <button className="campana-btn editar" onClick={() => abrirEditar(c)}>Editar</button>
                <button className="campana-btn eliminar" onClick={() => handleEliminar(c._id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="campanas-modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="campanas-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editandoId ? 'Editar Campaña' : 'Nueva Campaña'}</h2>

            <div className="campanas-form-grupo">
              <label>Nombre *</label>
              <input
                value={campanaActual.nombre}
                onChange={(e) => setCampanaActual({ ...campanaActual, nombre: e.target.value })}
                placeholder="Ej: Dia de la Madre 2026"
              />
            </div>

            <div className="campanas-form-grupo">
              <label>Tipo *</label>
              <select
                value={campanaActual.tipo}
                onChange={(e) => setCampanaActual({ ...campanaActual, tipo: e.target.value })}
              >
                <option value="temporada">Temporada</option>
                <option value="promocion">Promocion</option>
                <option value="evento">Evento</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="campanas-form-grupo">
              <label>Fecha inicio *</label>
              <input
                type="date"
                value={campanaActual.fechaInicio}
                onChange={(e) => setCampanaActual({ ...campanaActual, fechaInicio: e.target.value })}
              />
            </div>

            <div className="campanas-form-grupo">
              <label>Fecha fin *</label>
              <input
                type="date"
                value={campanaActual.fechaFin}
                onChange={(e) => setCampanaActual({ ...campanaActual, fechaFin: e.target.value })}
              />
            </div>

            <div className="campanas-form-grupo">
              <label>Descripcion</label>
              <textarea
                value={campanaActual.descripcion}
                onChange={(e) => setCampanaActual({ ...campanaActual, descripcion: e.target.value })}
                placeholder="Descripcion de la campaña..."
                rows={2}
              />
            </div>

            <div className="campanas-form-grupo">
              <label>Presupuesto (ARS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={campanaActual.presupuesto}
                onChange={(e) => setCampanaActual({ ...campanaActual, presupuesto: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="campanas-form-acciones">
              <button className="campanas-btn-cancelar" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button className="campanas-btn-guardar" onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Campanas;
