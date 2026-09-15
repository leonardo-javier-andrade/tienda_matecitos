import { useState, useEffect } from 'react';
import { obtenerProductos } from '../services/api';
import TarjetaProducto from './TarjetaProducto';
import './ListaProductos.css';

const CATEGORIAS = ['Todas', 'Mates', 'Bombillas', 'Termos', 'Yerberas', 'Kits', 'Accesorios'];

function ListaProductos({ usuario, favoritos, onToggleFav }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

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

  return (
    <section className="lista-productos">
      <h2>Nuestros Productos</h2>

      <div className="filtros-categoria">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            className={`filtro-btn ${categoriaActiva === cat ? 'activo' : ''}`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {cargando && <p className="estado-mensaje">Cargando productos...</p>}
      {error && <p className="estado-mensaje error">Error: {error}</p>}

      {!cargando && !error && productos.length === 0 && (
        <p className="estado-mensaje">No se encontraron productos en esta categoría.</p>
      )}

      <div className="productos-grid">
        {productos.map((producto) => (
          <TarjetaProducto
            key={producto._id}
            producto={producto}
            usuario={usuario}
            favoritos={favoritos}
            onToggleFav={onToggleFav}
          />
        ))}
      </div>
    </section>
  );
}

export default ListaProductos;
