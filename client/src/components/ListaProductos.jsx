import { useState, useEffect, useRef } from 'react';
import { obtenerProductos, obtenerCategorias } from '../services/api';
import TarjetaProducto from './TarjetaProducto';
import './ListaProductos.css';

function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [fondoActual, setFondoActual] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    obtenerCategorias()
      .then(({ datos }) => setCategorias(datos || []))
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        const filtros = categoriaActiva !== 'Todas' ? { categoria: categoriaActiva } : {};
        const { datos } = await obtenerProductos(filtros);
        setProductos(datos);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, [categoriaActiva]);

  // Update background media when category changes
  useEffect(() => {
    if (categoriaActiva === 'Todas') {
      // Buscar fondo general (categoría especial _todas)
      const fondoGeneral = categorias.find((c) => c.nombre === '_todas');
      if (fondoGeneral && fondoGeneral.fondoMedia && fondoGeneral.fondoMedia.url) {
        setFondoActual(fondoGeneral.fondoMedia);
      } else {
        setFondoActual(null);
      }
      return;
    }
    const cat = categorias.find((c) => c.nombre === categoriaActiva);
    if (cat && cat.fondoMedia && cat.fondoMedia.url) {
      setFondoActual(cat.fondoMedia);
    } else {
      setFondoActual(null);
    }
  }, [categoriaActiva, categorias]);

  // Ensure video plays when source changes
  useEffect(() => {
    if (videoRef.current && fondoActual?.tipo === 'video') {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [fondoActual]);

  const nombresCategorias = ['Todas', ...categorias.filter((c) => c.nombre !== '_todas').map((c) => c.nombre)];

  return (
    <section className="lista-productos">
      <div className={`lista-header-wrap ${fondoActual ? 'con-fondo' : ''}`}>
        {/* Background media */}
        {fondoActual && (
          <div className="lista-header-bg">
            {fondoActual.tipo === 'video' ? (
              <video
                ref={videoRef}
                className="lista-header-bg-media"
                src={fondoActual.url}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                className="lista-header-bg-media"
                src={fondoActual.url}
                alt=""
              />
            )}
            <div className="lista-header-bg-overlay" />
          </div>
        )}

        <div className="lista-header reveal-on-scroll">
          <h2>Nuestra Coleccion</h2>
          <p className="lista-subtitulo">Piezas que combinan tradicion artesanal con diseno contemporaneo</p>
        </div>

        <div className="filtros-categoria reveal-on-scroll">
          {nombresCategorias.map((cat) => (
            <button
              key={cat}
              className={`filtro-btn ${categoriaActiva === cat ? 'activo' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {cargando && (
        <div className="estado-cargando">
          <div className="cargando-spinner" />
          <p>Cargando productos...</p>
        </div>
      )}

      {error && <p className="estado-mensaje error">Error: {error}</p>}

      {!cargando && !error && productos.length === 0 && (
        <div className="estado-vacio">
          <span className="vacio-icon">🧉</span>
          <p>No se encontraron productos en esta categoria</p>
        </div>
      )}

      <div className="productos-grid">
        {productos.map((producto) => (
          <TarjetaProducto key={producto._id} producto={producto} />
        ))}
      </div>
    </section>
  );
}

export default ListaProductos;
