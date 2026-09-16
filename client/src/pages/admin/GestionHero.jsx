import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTodosHeroSlides,
  crearHeroSlide,
  actualizarHeroSlide,
  eliminarHeroSlide,
  subirArchivos,
  eliminarArchivo,
} from '../../services/api';
import './GestionHero.css';

function GestionHero() {
  const [slides, setSlides] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enlace, setEnlace] = useState('');
  const [textoBoton, setTextoBoton] = useState('Ver mas');
  const [orden, setOrden] = useState(0);
  const [activo, setActivo] = useState(true);
  const [imagenFondo, setImagenFondo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const cargarSlides = async () => {
    setCargando(true);
    try {
      const { datos } = await obtenerTodosHeroSlides();
      setSlides(datos || []);
    } catch (err) {
      console.error('Error cargando slides:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSlides();
  }, []);

  const limpiarForm = () => {
    setEditando(null);
    setTitulo('');
    setDescripcion('');
    setEnlace('');
    setTextoBoton('Ver mas');
    setOrden(0);
    setActivo(true);
    setImagenFondo(null);
    setError('');
  };

  const handleEditar = (slide) => {
    setEditando(slide._id);
    setTitulo(slide.titulo);
    setDescripcion(slide.descripcion || '');
    setEnlace(slide.enlace || '');
    setTextoBoton(slide.textoBoton || 'Ver mas');
    setOrden(slide.orden);
    setActivo(slide.activo);
    setImagenFondo(slide.imagenFondo || null);
    setError('');
  };

  const handleSubirImagen = async (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length === 0) return;

    setSubiendo(true);
    try {
      const resultado = await subirArchivos(archivos);
      if (resultado.exito && resultado.datos.length > 0) {
        const img = resultado.datos[0];
        setImagenFondo({ url: img.url, publicId: img.publicId });
      } else {
        setError(resultado.mensaje || 'Error al subir imagen');
      }
    } catch {
      setError('Error al subir imagen');
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleQuitarImagen = async () => {
    if (imagenFondo && imagenFondo.publicId) {
      try {
        await eliminarArchivo(imagenFondo.publicId, 'imagen');
      } catch (err) {
        console.error('Error eliminando imagen:', err);
      }
    }
    setImagenFondo(null);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('El titulo es obligatorio');
      return;
    }
    if (!imagenFondo) {
      setError('La imagen de fondo es obligatoria');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const datos = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        enlace: enlace.trim(),
        textoBoton: textoBoton.trim() || 'Ver mas',
        orden: Number(orden),
        activo,
        imagenFondo,
      };

      let resultado;
      if (editando) {
        resultado = await actualizarHeroSlide(editando, datos);
      } else {
        resultado = await crearHeroSlide(datos);
      }

      if (resultado.exito) {
        limpiarForm();
        cargarSlides();
      } else {
        setError(resultado.mensaje || 'Error al guardar');
      }
    } catch {
      setError('Error de conexion con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('Seguro que queres eliminar este slide del hero?')) return;

    setEliminando(id);
    try {
      const resultado = await eliminarHeroSlide(id);
      if (resultado.exito) {
        setSlides((prev) => prev.filter((s) => s._id !== id));
        if (editando === id) limpiarForm();
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="gestion-hero">
      <header className="gestion-hero-header">
        <button className="gestion-hero-volver" onClick={() => navigate('/admin')}>
          ← Volver
        </button>
        <h1>Gestionar Hero / Banner</h1>
      </header>

      {/* Formulario */}
      <div className="gestion-hero-form-card">
        <h2>{editando ? 'Editar Slide' : 'Nuevo Slide del Hero'}</h2>
        <form onSubmit={handleGuardar} className="gestion-hero-form">
          <div className="gestion-hero-grupo">
            <label htmlFor="hero-titulo">Titulo *</label>
            <input
              id="hero-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Nuevos Mates Artesanales"
              maxLength={120}
              required
            />
          </div>

          <div className="gestion-hero-grupo">
            <label htmlFor="hero-desc">Descripcion</label>
            <textarea
              id="hero-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripcion breve para el slide..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="gestion-hero-fila">
            <div className="gestion-hero-grupo">
              <label htmlFor="hero-enlace">Enlace (URL)</label>
              <input
                id="hero-enlace"
                type="text"
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="Ej: /productos o https://..."
              />
            </div>
            <div className="gestion-hero-grupo">
              <label htmlFor="hero-texto-btn">Texto del boton</label>
              <input
                id="hero-texto-btn"
                type="text"
                value={textoBoton}
                onChange={(e) => setTextoBoton(e.target.value)}
                placeholder="Ver mas"
                maxLength={50}
              />
            </div>
          </div>

          <div className="gestion-hero-fila">
            <div className="gestion-hero-grupo gestion-hero-grupo-sm">
              <label htmlFor="hero-orden">Orden</label>
              <input
                id="hero-orden"
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                min={0}
              />
            </div>
            <div className="gestion-hero-grupo gestion-hero-grupo-check">
              <label className="gestion-hero-check-label">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                Activo
              </label>
            </div>
          </div>

          {/* Imagen de fondo */}
          <div className="gestion-hero-grupo">
            <label>Imagen de fondo *</label>
            {imagenFondo ? (
              <div className="hero-img-preview">
                <img src={imagenFondo.url} alt="Fondo del hero" />
                <button type="button" className="hero-img-quitar" onClick={handleQuitarImagen}>
                  Quitar imagen
                </button>
              </div>
            ) : (
              <div
                className={`hero-img-upload ${subiendo ? 'subiendo' : ''}`}
                onClick={() => !subiendo && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSubirImagen}
                  style={{ display: 'none' }}
                />
                {subiendo ? (
                  <span>Subiendo imagen...</span>
                ) : (
                  <div className="hero-img-upload-placeholder">
                    <span className="hero-img-upload-icon">🖼️</span>
                    <span>Toca para subir imagen de fondo</span>
                    <span className="hero-img-upload-hint">JPG, PNG, WebP — Recomendado: 1920x800px</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="gestion-hero-error">{error}</p>}

          <div className="gestion-hero-form-acciones">
            <button type="submit" className="gestion-hero-btn-guardar" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Slide'}
            </button>
            {editando && (
              <button type="button" className="gestion-hero-btn-cancelar" onClick={limpiarForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de slides */}
      {cargando ? (
        <p className="gestion-hero-mensaje">Cargando slides...</p>
      ) : slides.length === 0 ? (
        <p className="gestion-hero-mensaje">No hay slides en el hero. Crea el primero arriba.</p>
      ) : (
        <div className="gestion-hero-lista">
          {slides.map((slide) => (
            <div key={slide._id} className={`gestion-hero-slide-card ${!slide.activo ? 'card-inactiva' : ''}`}>
              <div className="hero-slide-thumb">
                {slide.imagenFondo?.url ? (
                  <img src={slide.imagenFondo.url} alt={slide.titulo} />
                ) : (
                  <span className="hero-slide-thumb-placeholder">🖼️</span>
                )}
              </div>
              <div className="hero-slide-info">
                <h3 className="hero-slide-titulo">{slide.titulo}</h3>
                {slide.descripcion && (
                  <p className="hero-slide-desc">{slide.descripcion}</p>
                )}
                <div className="hero-slide-meta">
                  <span className="hero-slide-orden">Orden: {slide.orden}</span>
                  <span className={`gestion-cat-estado ${slide.activo ? 'activo' : 'inactivo'}`}>
                    {slide.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <div className="hero-slide-acciones">
                <button className="btn-editar" onClick={() => handleEditar(slide)}>
                  Editar
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => handleEliminar(slide._id)}
                  disabled={eliminando === slide._id}
                >
                  {eliminando === slide._id ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GestionHero;
