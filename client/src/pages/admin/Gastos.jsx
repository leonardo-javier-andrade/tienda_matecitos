import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerGastos,
  obtenerResumenGastos,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
} from '../../services/api';
import './Gastos.css';

const CATEGORIAS = [
  { value: 'envio', label: 'Envio' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'materia_prima', label: 'Materia Prima' },
  { value: 'comision_mp', label: 'Comision MP' },
  { value: 'otro', label: 'Otro' },
];

const gastoVacio = {
  descripcion: '',
  monto: '',
  categoria: 'otro',
  fecha: new Date().toISOString().split('T')[0],
  recurrente: false,
  frecuencia: null,
  notas: '',
};

function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoActual, setGastoActual] = useState(gastoVacio);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const filtros = {};
      if (filtroCategoria) filtros.categoria = filtroCategoria;
      if (filtroDesde) filtros.desde = filtroDesde;
      if (filtroHasta) filtros.hasta = filtroHasta;

      const [resGastos, resResumen] = await Promise.all([
        obtenerGastos(filtros),
        obtenerResumenGastos(filtros),
      ]);

      if (resGastos.exito) setGastos(resGastos.datos);
      if (resResumen.exito) setResumen(resResumen.datos);
    } catch (err) {
      console.error('Error cargando gastos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroCategoria, filtroDesde, filtroHasta]);

  const abrirNuevo = () => {
    setGastoActual(gastoVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirEditar = (gasto) => {
    setGastoActual({
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: gasto.fecha ? gasto.fecha.split('T')[0] : '',
      recurrente: gasto.recurrente || false,
      frecuencia: gasto.frecuencia || null,
      notas: gasto.notas || '',
    });
    setEditandoId(gasto._id);
    setModalAbierto(true);
  };

  const handleGuardar = async () => {
    if (!gastoActual.descripcion || !gastoActual.monto || !gastoActual.categoria) return;
    setGuardando(true);
    try {
      const datos = {
        ...gastoActual,
        monto: Number(gastoActual.monto),
        frecuencia: gastoActual.recurrente ? gastoActual.frecuencia : null,
      };

      const res = editandoId
        ? await actualizarGasto(editandoId, datos)
        : await crearGasto(datos);

      if (res.exito) {
        setModalAbierto(false);
        cargarDatos();
      }
    } catch (err) {
      console.error('Error guardando gasto:', err);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    try {
      const res = await eliminarGasto(id);
      if (res.exito) cargarDatos();
    } catch (err) {
      console.error('Error eliminando gasto:', err);
    }
  };

  const formatMoney = (n) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);
  };

  const catLabel = (val) => CATEGORIAS.find((c) => c.value === val)?.label || val;

  return (
    <div className="gastos-page">
      <div className="gastos-header">
        <h1>Gastos</h1>
        <div className="gastos-header-btns">
          <Link to="/admin" className="gastos-btn-volver">← Panel</Link>
          <button className="gastos-btn-nuevo" onClick={abrirNuevo}>+ Nuevo Gasto</button>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="gastos-resumen">
          <div className="gastos-card">
            <span className="gastos-card-monto">{formatMoney(resumen.totalGeneral)}</span>
            <span className="gastos-card-label">Total (periodo)</span>
          </div>
          <div className="gastos-card">
            <span className="gastos-card-monto">{formatMoney(resumen.totalMes)}</span>
            <span className="gastos-card-label">Este mes</span>
          </div>
          {resumen.porCategoria?.slice(0, 3).map((c) => (
            <div className="gastos-card" key={c._id}>
              <span className="gastos-card-monto" style={{ fontSize: '1.2rem' }}>{formatMoney(c.total)}</span>
              <span className="gastos-card-label">{catLabel(c._id)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="gastos-filtros">
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
        <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
      </div>

      {/* Tabla */}
      {cargando ? (
        <p style={{ textAlign: 'center', color: '#b2bec3' }}>Cargando...</p>
      ) : gastos.length === 0 ? (
        <div className="gastos-vacio">
          <p>No hay gastos registrados</p>
          <button className="gastos-btn-nuevo" onClick={abrirNuevo}>Registrar primer gasto</button>
        </div>
      ) : (
        <div className="gastos-tabla-wrap">
          <table className="gastos-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Categoria</th>
                <th>Monto</th>
                <th>Recurrente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g._id}>
                  <td>{g.fecha ? new Date(g.fecha).toLocaleDateString('es-AR') : '-'}</td>
                  <td>{g.descripcion}</td>
                  <td><span className="gastos-cat-badge">{catLabel(g.categoria)}</span></td>
                  <td style={{ fontWeight: 600, color: '#d63031' }}>{formatMoney(g.monto)}</td>
                  <td>{g.recurrente ? `Si (${g.frecuencia || '-'})` : 'No'}</td>
                  <td>
                    <div className="gastos-acciones">
                      <button className="gastos-btn-editar" onClick={() => abrirEditar(g)}>Editar</button>
                      <button className="gastos-btn-eliminar" onClick={() => handleEliminar(g._id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulario */}
      {modalAbierto && (
        <div className="gastos-modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="gastos-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editandoId ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>

            <div className="gastos-form-grupo">
              <label>Descripcion *</label>
              <input
                value={gastoActual.descripcion}
                onChange={(e) => setGastoActual({ ...gastoActual, descripcion: e.target.value })}
                placeholder="Ej: Pago hosting mensual"
              />
            </div>

            <div className="gastos-form-grupo">
              <label>Monto (ARS) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gastoActual.monto}
                onChange={(e) => setGastoActual({ ...gastoActual, monto: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="gastos-form-grupo">
              <label>Categoria *</label>
              <select
                value={gastoActual.categoria}
                onChange={(e) => setGastoActual({ ...gastoActual, categoria: e.target.value })}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="gastos-form-grupo">
              <label>Fecha</label>
              <input
                type="date"
                value={gastoActual.fecha}
                onChange={(e) => setGastoActual({ ...gastoActual, fecha: e.target.value })}
              />
            </div>

            <div className="gastos-form-check">
              <input
                type="checkbox"
                checked={gastoActual.recurrente}
                onChange={(e) => setGastoActual({ ...gastoActual, recurrente: e.target.checked })}
                id="recurrente"
              />
              <label htmlFor="recurrente">Gasto recurrente</label>
            </div>

            {gastoActual.recurrente && (
              <div className="gastos-form-grupo">
                <label>Frecuencia</label>
                <select
                  value={gastoActual.frecuencia || ''}
                  onChange={(e) => setGastoActual({ ...gastoActual, frecuencia: e.target.value || null })}
                >
                  <option value="">Seleccionar</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            )}

            <div className="gastos-form-grupo">
              <label>Notas</label>
              <textarea
                value={gastoActual.notas}
                onChange={(e) => setGastoActual({ ...gastoActual, notas: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>

            <div className="gastos-form-acciones">
              <button className="gastos-btn-cancelar" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button className="gastos-btn-guardar" onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gastos;
