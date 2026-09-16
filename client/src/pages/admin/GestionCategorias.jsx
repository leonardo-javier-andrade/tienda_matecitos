import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTodasCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  subirArchivos,
  eliminarArchivo,
} from '../../services/api';
import './GestionCategorias.css';

function GestionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [orden, setOrden] = useState(0);
  const [activo, setActivo] = useState(true);
  const [fondoMedia, setFondoMedia] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [fondoTodas, setFondoTodas] = useState(null);
  const [subiendoTodas, setSubiendoTodas] = useState(false);
  const inputTodasRef = useRef(null);
  const inputRef = useRef(null);
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

  // Sync fondoTodas from the _todas category
  useEffect(() => {
    const todas = categorias.find((c) => c.nombre === '_todas');
    if (todas && todas.fondoMedia && todas.fondoMedia.url) {
      setFondoTodas({ ...todas.fondoMedia, _id: todas._id });
    } else {
      setFondoTodas(null);
    }
  }, [categorias]);

  const handleSubirMediaTodas = async (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length === 0) return;
    setSubiendoTodas(true);
    try {
      const resultado = await subirArchivos(archivos);
      if (resultado.exito && resultado.datos.length > 0) {
        const media = resultado.datos[0];
        const fondoData = {
          url: media.url,
          publicId: media.publicId,
          tipo: media.tipo === 'video' ? 'video' : 'imagen',
        };
        // Check if _todas category exists
        const todas = categorias.find((c) => c.nombre === '_todas');
        if (todas) {
          await actualizarCategoria(todas._id, { fondoMedia: fondoData });
        } else {
          await crearCategoria({ nombre: '_todas', orden: 9999, activo: true, fondoMedia: fondoData });
        }
        cargarCategorias();
      }
    } catch {
      setError('Error al subir fondo de Todas');
    } finally {
      setSubiendoTodas(false);
      if (inputTodasRef.current) inputTodasRef.current.value = '';
    }
  };

  const handleQuitarMediaTodas = async () => {
    if (fondoTodas && fondoTodas.publicId) {
      try {
        await eliminarArchivo(fondoTodas.publicId, fondoTodas.tipo === 'video' ? 'video' : 'imagen');
      } catch (err) {
        console.error('Error eliminando media:', err);
      }
    }
    if (fondoTodas && fondoTodas._id) {
      await actualizarCategoria(fondoTodas._id, { fondoMedia: { url: '', publicId: '', tipo: '' } });
      cargarCategorias();
    }
  };

  const limpiarForm = () => {
    setEditando(null);
    setNombre('');
    setOrden(0);
    setActivo(true);
    setFondoMedia(null);
    setError('');
  };

  const handleEditar = (cat) => {
    setEditando(cat._id);
    setNombre(cat.nombre);
    setOrden(cat.orden);
    setActivo(cat.activo);
    setFondoMedia(cat.fondoMedia && cat.fondoMedia.url ? cat.fondoMedia : null);
    setError('');
  };

  const handleSubirMedia = async (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length === 0) return;

    setSubiendo(true);
    try {
      const resultado = await subirArchivos(archivos);
      if (resultado.exito && resultado.datos.length > 0) {
        const media = resultado.datos[0];
        setFondoMedia({
          url: media.url,
          publicId: media.publicId,
          tipo: media.tipo === 'video' ? 'video' : 'imagen',
        });
      } else {
        setError(resultado.mensaje || 'Error al subir archivo');
      }
    } catch {
      setError('Error al subir archivo');
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleQuitarMedia = async () => {
    if (fondoMedia && fondoMedia.publicId) {
      try {
        await eliminarArchivo(fondoMedia.publicId, fondoMedia.tipo === 'video' ? 'video' : 'imagen');
      } catch (err) {
        console.error('Error eliminando media:', err);
      }
    }
    setFondoMedia(null);
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
      const datos = {
        nombre: nombre.trim(),
        orden: Number(orden),
        activo,
        fondoMedia: fondoMedia || { url: '', publicId: '', tipo: '' },
      };
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

          {/* Fondo media (imagen o video) */}
          <div className="gestion-cat-grupo">
            <label>Fondo de categoria (opcional)</label>
            <p className="gestion-cat-media-hint">
              Imagen o video que aparecera como fondo al seleccionar esta categoria en la tienda.
            </p>
            {fondoMedia ? (
              <div className="cat-media-preview">
                {fondoMedia.tipo === 'video' ? (
                  <video src={fondoMedia.url} autoPlay loop muted playsInline className="cat-media-thumb" />
                ) : (
                  <img src={fondoMedia.url} alt="Fondo de categoria" className="cat-media-thumb" />
                )}
                <div className="cat-media-preview-info">
                  <span className="cat-media-badge">{fondoMedia.tipo === 'video' ? '🎬 Video' : '🖼️ Imagen'}</span>
                  <button type="button" className="cat-media-quitar" onClick={handleQuitarMedia}>
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`cat-media-upload ${subiendo ? 'subiendo' : ''}`}
                onClick={() => !subiendo && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleSubirMedia}
                  style={{ display: 'none' }}
                />
                {subiendo ? (
                  <span>Subiendo...</span>
                ) : (
                  <div className="cat-media-upload-placeholder">
                    <span>📷</span>
                    <span>Subir imagen o video de fondo</span>
                    <span className="cat-media-upload-hint">JPG, PNG, WebP, MP4, WebM</span>
                  </div>
                )}
              </div>
            )}
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

      {/* Fondo general "Todas" */}
      <div className="gestion-cat-form-card gestion-cat-todas-card">
        <h2>Fondo de &quot;Todas&quot;</h2>
        <p className="gestion-cat-media-hint">
          Imagen o video de fondo que se muestra cuando el usuario tiene seleccionada la categoria &quot;Todas&quot;.
        </p>
        {fondoTodas && fondoTodas.url ? (
          <div className="cat-media-preview">
            {fondoTodas.tipo === 'video' ? (
              <video src={fondoTodas.url} autoPlay loop muted playsInline className="cat-media-thumb" />
            ) : (
              <img src={fondoTodas.url} alt="Fondo Todas" className="cat-media-thumb" />
            )}
            <div className="cat-media-preview-info">
              <span className="cat-media-badge">{fondoTodas.tipo === 'video' ? '🎬 Video' : '🖼️ Imagen'}</span>
              <button type="button" className="cat-media-quitar" onClick={handleQuitarMediaTodas}>
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`cat-media-upload ${subiendoTodas ? 'subiendo' : ''}`}
            onClick={() => !subiendoTodas && inputTodasRef.current?.click()}
          >
            <input
              ref={inputTodasRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              onChange={handleSubirMediaTodas}
              style={{ display: 'none' }}
            />
            {subiendoTodas ? (
              <span>Subiendo...</span>
            ) : (
              <div className="cat-media-upload-placeholder">
                <span>📷</span>
                <span>Subir imagen o video</span>
                <span className="cat-media-upload-hint">JPG, PNG, WebP, MP4, WebM</span>
              </div>
            )}
          </div>
        )}
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
                  <th>Fondo</th>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.filter((c) => c.nombre !== '_todas').map((cat) => (
                  <tr key={cat._id} className={!cat.activo ? 'fila-inactiva' : ''}>
                    <td className="gestion-cat-nombre">{cat.nombre}</td>
                    <td>
                      {cat.fondoMedia?.url ? (
                        <span className="cat-media-badge-sm">
                          {cat.fondoMedia.tipo === 'video' ? '🎬' : '🖼️'}
                        </span>
                      ) : (
                        <span className="cat-media-badge-sm cat-sin-fondo">—</span>
                      )}
                    </td>
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
            {categorias.filter((c) => c.nombre !== '_todas').map((cat) => (
              <div key={cat._id} className={`gestion-cat-card ${!cat.activo ? 'card-inactiva' : ''}`}>
                <div className="gestion-cat-card-info">
                  <div className="gestion-cat-card-nombre-row">
                    <span className="gestion-cat-card-nombre">{cat.nombre}</span>
                    {cat.fondoMedia?.url && (
                      <span className="cat-media-badge-sm">
                        {cat.fondoMedia.tipo === 'video' ? '🎬' : '🖼️'}
                      </span>
                    )}
                  </div>
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
