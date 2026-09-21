import { useState, useEffect, useRef } from 'react';
import { obtenerProductos, obtenerCategorias, obtenerFavoritos } from '../services/api';
import TarjetaProducto from './TarjetaProducto';
import './ListaProductos.css';

function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [fondoActual, setFondoActual] = useState(null);
  const [favIds, setFavIds] = useState(new Set());
  const videoRef = useRef(null);

  useEffect(() => {
    obtenerCategorias()
      .then(({ datos }) => setCategorias(datos || []))
      .catch(() => setCategorias([]));

    // Cargar favoritos si está logueado
    const token = localStorage.getItem('user_token');
    if (token) {
      obtenerFavoritos()
        .then((res) => {
          if (res.exito && Array.isArray(res.datos)) {
            setFavIds(new Set(res.datos.map((p) => p._id)));
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        const filtros = categoriaActiva !== 'Todas' ? { categoria: categoriaActiva } : {};
        const { datos } = await obtenerProductos(filtros);
        // Ordenar: productos con stock > 0 primero, sin stock al final
        const ordenados = [...datos].sort((a, b) => {
          if (a.stock === 0 && b.stock > 0) return 1;
          if (a.stock > 0 && b.stock === 0) return -1;
          return 0;
        });
        setProductos(ordenados);
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

  const handleToggleFav = (productoId, agregado) => {
    setFavIds((prev) => {
      const next = new Set(prev);
      if (agregado) next.add(productoId);
      else next.delete(productoId);
      return next;
    });
  };

  const nombresCategorias = ['Todas', ...categorias.filter((c) => c.nombre !== '_todas').map((c) => c.nombre)];

  return (
    <section className="lista-productos">
      <div className={`lista-header-wrap ${fondoActual ? 'con-fondo' : ''}`}>
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
          <TarjetaProducto
            key={producto._id}
            producto={producto}
            esFavorito={favIds.has(producto._id)}
            onToggleFav={handleToggleFav}
          />
        ))}
      </div>
    </section>
  );
}

export default ListaProductos;
