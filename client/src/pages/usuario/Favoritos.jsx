import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerFavoritos, toggleFavorito } from '../../services/api';
import TarjetaProducto from '../../components/TarjetaProducto';
import './Favoritos.css';

function Favoritos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/ingresar');
      return;
    }

    obtenerFavoritos()
      .then((res) => setProductos(res.datos || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [navigate]);

  const handleToggleFav = useCallback((productoId, agregado) => {
    if (!agregado) {
      // Quitar de la lista visualmente
      setProductos((prev) => prev.filter((p) => p._id !== productoId));
    }
  }, []);

  return (
    <div className="favoritos-container">
      <div className="favoritos-header">
        <Link to="/" className="favoritos-volver">← Volver</Link>
        <h1>❤️ Mis Favoritos</h1>
        <p>
          {productos.length > 0
            ? `Tenes ${productos.length} producto${productos.length !== 1 ? 's' : ''} guardado${productos.length !== 1 ? 's' : ''}`
            : 'Todavia no guardaste ningun producto'}
        </p>
      </div>

      {cargando && <p className="favoritos-estado">Cargando favoritos...</p>}

      {!cargando && productos.length === 0 && (
        <div className="favoritos-vacio">
          <span className="favoritos-vacio-icon">🤍</span>
          <h2>No tenes favoritos todavia</h2>
          <p>Explora la tienda y guarda los productos que mas te gusten</p>
          <button className="favoritos-btn-explorar" onClick={() => navigate('/')}>
            Explorar Productos
          </button>
        </div>
      )}

      <div className="favoritos-grid">
        {productos.map((producto) => (
          <TarjetaProducto
            key={producto._id}
            producto={producto}
            esFavorito={true}
            onToggleFav={handleToggleFav}
          />
        ))}
      </div>
    </div>
  );
}

export default Favoritos;
