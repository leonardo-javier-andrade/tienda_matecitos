import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  obtenerTodosProductos,
  eliminarProducto,
  logoutUsuario,
} from '../../services/api';
import './Dashboard.css';

const CATEGORIAS = ['Todas', 'Mates', 'Bombillas', 'Termos', 'Yerberas', 'Kits', 'Accesorios'];

function Dashboard() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const navigate = useNavigate();

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const filtros = {};
      if (filtroCategoria !== 'Todas') filtros.categoria = filtroCategoria;
      if (busqueda) filtros.buscar = busqueda;

      const { datos } = await obtenerTodosProductos(filtros);
      setProductos(datos);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [filtroCategoria]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarProductos();
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setEliminando(id);
    try {
      const resultado = await eliminarProducto(id);
      if (resultado.exito) {
        setProductos((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setEliminando(null);
    }
  };

  const handleLogout = () => {
    logoutUsuario();
    navigate('/');
  };

  const formatearPrecio = (precio) =>
    precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  // Estadísticas rápidas
  const totalProductos = productos.length;
  const productosActivos = productos.filter((p) => p.activo).length;
  const sinStock = productos.filter((p) => p.stock === 0).length;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-izq">
          <h1>🧉 Panel de Administración</h1>
        </div>
        <div className="dash-header-der">
          <a href="/" className="dash-btn-tienda" target="_blank" rel="noopener">
            Ver tienda ↗
          </a>
          <button className="dash-btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="dash-stats">
        <div className="stat-card">
          <span className="stat-numero">{totalProductos}</span>
          <span className="stat-label">Total productos</span>
        </div>
        <div className="stat-card">
          <span className="stat-numero">{productosActivos}</span>
          <span className="stat-label">Activos</span>
        </div>
        <div className="stat-card alerta">
          <span className="stat-numero">{sinStock}</span>
          <span className="stat-label">Sin stock</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dash-toolbar">
        <Link to="/admin/nuevo" className="dash-btn-nuevo">
          + Nuevo Producto
        </Link>

        <form className="dash-busqueda" onSubmit={handleBuscar}>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
          />
          <button type="submit">Buscar</button>
        </form>
      </div>

      {/* Filtros */}
      <div className="dash-filtros">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            className={`filtro-chip ${filtroCategoria === cat ? 'activo' : ''}`}
            onClick={() => setFiltroCategoria(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {cargando ? (
        <p className="dash-mensaje">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <div className="dash-vacio">
          <p>No hay productos todavía.</p>
          <Link to="/admin/nuevo" className="dash-btn-nuevo">
            Crear el primero
          </Link>
        </div>
      ) : (
        <>
          {/* Tabla de productos (desktop) */}
          <div className="dash-tabla-wrapper">
            <table className="dash-tabla">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod._id} className={!prod.activo ? 'fila-inactiva' : ''}>
                    <td>
                      <div className="tabla-thumb">
                        {prod.imagenes && prod.imagenes.length > 0 ? (
                          <img src={prod.imagenes[0].url} alt={prod.nombre} />
                        ) : (
                          <span className="thumb-placeholder">🧉</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="tabla-nombre">{prod.nombre}</span>
                      {prod.destacado && <span className="tabla-badge-dest">⭐</span>}
                    </td>
                    <td>
                      <span className="tabla-categoria">{prod.categoria}</span>
                    </td>
                    <td className="tabla-precio">{formatearPrecio(prod.precio)}</td>
                    <td>
                      <span className={`tabla-stock ${prod.stock === 0 ? 'sin-stock' : ''}`}>
                        {prod.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`tabla-estado ${prod.activo ? 'activo' : 'inactivo'}`}>
                        {prod.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="tabla-acciones">
                        <Link to={`/admin/editar/${prod._id}`} className="btn-editar">
                          Editar
                        </Link>
                        <button
                          className="btn-eliminar"
                          onClick={() => handleEliminar(prod._id, prod.nombre)}
                          disabled={eliminando === prod._id}
                        >
                          {eliminando === prod._id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards de productos (mobile) */}
          <div className="dash-cards-mobile">
            {productos.map((prod) => (
              <div key={prod._id} className={`dash-card ${!prod.activo ? 'card-inactiva' : ''}`}>
                <div className="card-top">
                  <div className="card-thumb">
                    {prod.imagenes && prod.imagenes.length > 0 ? (
                      <img src={prod.imagenes[0].url} alt={prod.nombre} />
                    ) : (
                      <span className="thumb-placeholder">🧉</span>
                    )}
                  </div>
                  <div className="card-info">
                    <h3 className="card-nombre">
                      {prod.nombre}
                      {prod.destacado && ' ⭐'}
                    </h3>
                    <span className="tabla-categoria">{prod.categoria}</span>
                    <div className="card-meta">
                      <span className="card-precio">{formatearPrecio(prod.precio)}</span>
                      <span className={`tabla-stock ${prod.stock === 0 ? 'sin-stock' : ''}`}>
                        Stock: {prod.stock}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-bottom">
                  <span className={`tabla-estado ${prod.activo ? 'activo' : 'inactivo'}`}>
                    {prod.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="card-acciones">
                    <Link to={`/admin/editar/${prod._id}`} className="btn-editar">
                      Editar
                    </Link>
                    <button
                      className="btn-eliminar"
                      onClick={() => handleEliminar(prod._id, prod.nombre)}
                      disabled={eliminando === prod._id}
                    >
                      {eliminando === prod._id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
