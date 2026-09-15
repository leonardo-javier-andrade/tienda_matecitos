import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  crearProducto,
  actualizarProducto,
  obtenerProductoPorId,
  subirArchivos,
  eliminarArchivo,
} from '../../services/api';
import SubidaArchivos from '../../components/SubidaArchivos';
import './FormularioProducto.css';

const CATEGORIAS = ['Mates', 'Bombillas', 'Termos', 'Yerberas', 'Kits', 'Accesorios'];

const productoVacio = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: 0,
  imagenes: [],
  videos: [],
  imagenHero: null,
  categoria: 'Mates',
  destacado: false,
  promocionCentro: false,
  activo: true,
};

function FormularioProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [producto, setProducto] = useState(productoVacio);
  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(esEdicion);
  const [subiendoHero, setSubiendoHero] = useState(false);
  const heroInputRef = useRef(null);

  useEffect(() => {
    if (esEdicion) {
      obtenerProductoPorId(id)
        .then(({ datos }) => {
          setProducto({
            nombre: datos.nombre,
            descripcion: datos.descripcion || '',
            precio: datos.precio,
            stock: datos.stock,
            imagenes: datos.imagenes || [],
            videos: datos.videos || [],
            imagenHero: datos.imagenHero || null,
            categoria: datos.categoria,
            destacado: datos.destacado,
            promocionCentro: datos.promocionCentro || false,
            activo: datos.activo,
          });
        })
        .catch(() => setErrores(['No se pudo cargar el producto.']))
        .finally(() => setCargando(false));
    }
  }, [id, esEdicion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProducto((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleArchivosChange = ({ imagenes, videos }) => {
    setProducto((prev) => ({ ...prev, imagenes, videos }));
  };

  // ─── Hero Image Upload ───────────────────────────────
  const handleHeroSeleccion = async (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length === 0) return;

    setSubiendoHero(true);
    try {
      const resultado = await subirArchivos(archivos);
      if (resultado.exito && resultado.datos.length > 0) {
        const item = resultado.datos[0];
        setProducto((prev) => ({
          ...prev,
          imagenHero: { url: item.url, publicId: item.publicId },
        }));
      }
    } catch (err) {
      console.error('Error subiendo imagen hero:', err);
    } finally {
      setSubiendoHero(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const handleEliminarHero = async () => {
    if (!producto.imagenHero) return;
    try {
      await eliminarArchivo(producto.imagenHero.publicId, 'imagen');
      setProducto((prev) => ({ ...prev, imagenHero: null }));
    } catch (err) {
      console.error('Error eliminando imagen hero:', err);
    }
  };

  // ─── Submit ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);
    setGuardando(true);

    const datosEnviar = {
      ...producto,
      precio: Number(producto.precio),
      stock: Number(producto.stock),
    };

    try {
      const resultado = esEdicion
        ? await actualizarProducto(id, datosEnviar)
        : await crearProducto(datosEnviar);

      if (resultado.exito) {
        navigate('/admin');
      } else {
        setErrores(resultado.errores || [resultado.mensaje]);
      }
    } catch {
      setErrores(['Error de conexión con el servidor.']);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="form-container">
        <p className="form-cargando">Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <button className="form-volver" onClick={() => navigate('/admin')}>
          ← Volver
        </button>
        <h1>{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h1>
      </div>

      {errores.length > 0 && (
        <div className="form-errores">
          {errores.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-grupo">
          <label htmlFor="nombre">Nombre *</label>
          <input
            id="nombre"
            name="nombre"
            value={producto.nombre}
            onChange={handleChange}
            placeholder="Ej: Mate Imperial de Algarrobo"
            required
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={producto.descripcion}
            onChange={handleChange}
            placeholder="Descripción del producto..."
            rows={3}
          />
        </div>

        <div className="form-fila">
          <div className="form-grupo">
            <label htmlFor="precio">Precio (ARS) *</label>
            <input
              id="precio"
              name="precio"
              type="number"
              min="0"
              step="0.01"
              value={producto.precio}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={producto.stock}
              onChange={handleChange}
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="categoria">Categoría *</label>
            <select
              id="categoria"
              name="categoria"
              value={producto.categoria}
              onChange={handleChange}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SubidaArchivos
          imagenes={producto.imagenes}
          videos={producto.videos}
          onChange={handleArchivosChange}
        />

        <div className="form-checks">
          <label className="check-label">
            <input
              type="checkbox"
              name="destacado"
              checked={producto.destacado}
              onChange={handleChange}
            />
            <span className="check-icono">⭐</span>
            Producto destacado
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              name="promocionCentro"
              checked={producto.promocionCentro}
              onChange={handleChange}
            />
            <span className="check-icono">🎯</span>
            Promoción Centro Pág
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              name="activo"
              checked={producto.activo}
              onChange={handleChange}
            />
            <span className="check-icono">✅</span>
            Activo (visible en la tienda)
          </label>
        </div>

        {/* ─── Hero Image Upload (only when promocionCentro is active) ─── */}
        {producto.promocionCentro && (
          <div className="hero-upload-section">
            <div className="hero-upload-header">
              <h3 className="hero-upload-titulo">
                🖼️ Imagen del Hero (Carrusel Principal)
              </h3>
              <p className="hero-upload-desc">
                Esta imagen se usará como fondo del carrusel en la página principal. Recomendado: 1920×600px o mayor, formato horizontal.
              </p>
            </div>

            {producto.imagenHero ? (
              <div className="hero-preview">
                <img
                  src={producto.imagenHero.url}
                  alt="Imagen hero"
                  className="hero-preview-img"
                />
                <button
                  type="button"
                  className="hero-preview-eliminar"
                  onClick={handleEliminarHero}
                >
                  ✕ Eliminar
                </button>
              </div>
            ) : (
              <div
                className={`hero-upload-zona ${subiendoHero ? 'subiendo' : ''}`}
                onClick={() => !subiendoHero && heroInputRef.current?.click()}
              >
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleHeroSeleccion}
                  style={{ display: 'none' }}
                />
                {subiendoHero ? (
                  <div className="hero-upload-spinner">
                    <div className="spinner" />
                    <span>Subiendo imagen...</span>
                  </div>
                ) : (
                  <div className="hero-upload-placeholder">
                    <span className="hero-upload-icono">🌄</span>
                    <span className="hero-upload-texto">
                      Hacé click para subir la imagen del Hero
                    </span>
                    <span className="hero-upload-hint">
                      JPG, PNG, WebP — Formato horizontal recomendado
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="form-acciones">
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => navigate('/admin')}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-guardar" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioProducto;
