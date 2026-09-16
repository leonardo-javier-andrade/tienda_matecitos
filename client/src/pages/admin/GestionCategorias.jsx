import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTodasCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../../services/api';
import './GestionCategorias.css';

function GestionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [orden, setOrden] = useState(0);
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const navigate = useNavigate();

  const cargarCategorias = async () => {
    setCargando(true);
    try {
      const { datos } = await obtenerTodasCategorias();
      setCategorias(datos);
    } catch (err) {
      console.error('Error cargando categorias:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const limpiarForm = () => {
    setEditando(null);
    setNombre('');
    setOrden(0);
    setActivo(true);
    setError('');
  };

  const handleEditar = (cat) => {
    setEditando(cat._id);
    setNombre(cat.nombre);
    setOrden(cat.orden);
    setActivo(cat.activo);
    setError('');
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const datos = { nombre: nombre.trim(), orden: Number(orden), activo };
      let resultado;

      if (editando) {
        resultado = await actualizarCategoria(editando, datos);
      } else {
        resultado = await crearCategoria(datos);
      }

      if (resultado.exito) {
        limpiarForm();
        cargarCategorias();
      } else {
        setError(resultado.mensaje || 'Error al guardar');
      }
    } catch {
      setError('Error de conexion con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombreCat) => {
    if (!window.confirm(`¿Seguro que queres eliminar la categoria "${nombreCat}"? Los productos con esta categoria no seran eliminados.`)) {
      return;
    }

    setEliminando(id);
    try {
      const resultado = await eliminarCategoria(id);
      if (resultado.exito) {
        setCategorias((prev) => prev.filter((c) => c._id !== id));
        if (editando === id) limpiarForm();
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="gestion-cat">
      <header className="gestion-cat-header">
        <button className="gestion-cat-volver" onClick={() => navigate('/admin')}>
          ← Volver
        </button>
        <h1>Gestionar Categorias</h1>
      </header>

      {/* Formulario agregar/editar */}
      <div className="gestion-cat-form-card">
        <h2>{editando ? 'Editar Categoria' : 'Nueva Categoria'}</h2>
        <form onSubmit={handleGuardar} className="gestion-cat-form">
          <div className="gestion-cat-form-row">
            <div className="gestion-cat-grupo">
              <label htmlFor="cat-nombre">Nombre *</label>
              <input
                id="cat-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Mates"
                maxLength={50}
                required
              />
            </div>
            <div className="gestion-cat-grupo gestion-cat-grupo-sm">
              <label htmlFor="cat-orden">Orden</label>
              <input
                id="cat-orden"
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                min={0}
              />
            </div>
            <div className="gestion-cat-grupo gestion-cat-grupo-check">
              <label className="gestion-cat-check-label">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                Activa
              </label>
            </div>
          </div>

          {error && <p className="gestion-cat-error">{error}</p>}

          <div className="gestion-cat-form-acciones">
            <button type="submit" className="gestion-cat-btn-guardar" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Categoria'}
            </button>
            {editando && (
              <button type="button" className="gestion-cat-btn-cancelar" onClick={limpiarForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de categorias */}
      {cargando ? (
        <p className="gestion-cat-mensaje">Cargando categorias...</p>
      ) : categorias.length === 0 ? (
        <p className="gestion-cat-mensaje">No hay categorias creadas.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="gestion-cat-tabla-wrapper">
            <table className="gestion-cat-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <tr key={cat._id} className={!cat.activo ? 'fila-inactiva' : ''}>
                    <td className="gestion-cat-nombre">{cat.nombre}</td>
                    <td>{cat.orden}</td>
                    <td>
                      <span className={`gestion-cat-estado ${cat.activo ? 'activo' : 'inactivo'}`}>
                        {cat.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="gestion-cat-acciones">
                        <button
                          className="btn-editar"
                          onClick={() => handleEditar(cat)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-eliminar"
                          onClick={() => handleEliminar(cat._id, cat.nombre)}
                          disabled={eliminando === cat._id}
                        >
                          {eliminando === cat._id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="gestion-cat-cards-mobile">
            {categorias.map((cat) => (
              <div key={cat._id} className={`gestion-cat-card ${!cat.activo ? 'card-inactiva' : ''}`}>
                <div className="gestion-cat-card-info">
                  <span className="gestion-cat-card-nombre">{cat.nombre}</span>
                  <div className="gestion-cat-card-meta">
                    <span className="gestion-cat-card-orden">Orden: {cat.orden}</span>
                    <span className={`gestion-cat-estado ${cat.activo ? 'activo' : 'inactivo'}`}>
                      {cat.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <div className="gestion-cat-card-acciones">
                  <button className="btn-editar" onClick={() => handleEditar(cat)}>
                    Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => handleEliminar(cat._id, cat.nombre)}
                    disabled={eliminando === cat._id}
                  >
                    {eliminando === cat._id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default GestionCategorias;
