import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerFavoritos } from '../../services/api';
import TarjetaProducto from '../../components/TarjetaProducto';
import './Favoritos.css';

function Favoritos({ usuario, favoritos, onToggleFav }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) {
      navigate('/ingresar');
      return;
    }

    const cargar = async () => {
      try {
        const resultado = await obtenerFavoritos();
        setProductos(resultado.datos || []);
      } catch (err) {
        console.error('Error al cargar favoritos:', err);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [usuario, navigate, favoritos]);

  if (!usuario) return null;

  return (
    <div className="favoritos-container">
      <div className="favoritos-header">
        <h1>❤️ Mis Favoritos</h1>
        <p>
          {productos.length > 0
            ? `Tenés ${productos.length} producto${productos.length !== 1 ? 's' : ''} guardado${productos.length !== 1 ? 's' : ''}`
            : 'Todavía no guardaste ningún producto'}
        </p>
      </div>

      {cargando && <p className="favoritos-estado">Cargando favoritos...</p>}

      {!cargando && productos.length === 0 && (
        <div className="favoritos-vacio">
          <span className="favoritos-vacio-icon">🤍</span>
          <h2>No tenés favoritos todavía</h2>
          <p>Explorá la tienda y guardá los productos que más te gusten</p>
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
            usuario={usuario}
            favoritos={favoritos}
            onToggleFav={onToggleFav}
          />
        ))}
      </div>
    </div>
  );
}

export default Favoritos;
