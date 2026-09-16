import { useState, useEffect } from 'react';
import { obtenerProductos, obtenerCategorias } from '../services/api';
import TarjetaProducto from './TarjetaProducto';
import './ListaProductos.css';

function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

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

  const nombresCategorias = ['Todas', ...categorias.map((c) => c.nombre)];

  return (
    <section className="lista-productos">
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
