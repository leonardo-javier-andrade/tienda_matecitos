import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ usuario, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-contenido">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🧉</span>
          <span className="navbar-logo-texto">Tienda Matecitos</span>
        </Link>

        {/* Links de navegación */}
        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'activo' : ''}`}>
            Productos
          </Link>
        </div>

        {/* Sección de usuario */}
        <div className="navbar-usuario" ref={menuRef}>
          {usuario ? (
            <>
              <button
                className="navbar-avatar-btn"
                onClick={() => setMenuAbierto(!menuAbierto)}
                title={usuario.nombre}
              >
                <span className="navbar-avatar">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="navbar-nombre-corto">{usuario.nombre.split(' ')[0]}</span>
                <span className={`navbar-chevron ${menuAbierto ? 'abierto' : ''}`}>&#9662;</span>
              </button>

              {menuAbierto && (
                <div className="navbar-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-nombre">{usuario.nombre}</span>
                    <span className="dropdown-email">{usuario.email}</span>
                    <span className={`dropdown-rol ${usuario.rol}`}>
                      {usuario.rol === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>
                  <div className="dropdown-divider" />

                  {usuario.rol === 'admin' && (
                    <Link to="/admin" className="dropdown-item">
                      <span className="dropdown-icono">📊</span>
                      Panel Admin
                    </Link>
                  )}

                  <Link to="/mi-cuenta" className="dropdown-item">
                    <span className="dropdown-icono">👤</span>
                    Mi Cuenta
                  </Link>

                  <Link to="/favoritos" className="dropdown-item">
                    <span className="dropdown-icono">❤️</span>
                    Mis Favoritos
                  </Link>

                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    <span className="dropdown-icono">🚪</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="navbar-auth-links">
              <Link to="/ingresar" className="navbar-btn-ingresar">
                Ingresar
              </Link>
              <Link to="/registro" className="navbar-btn-registro">
                Crear Cuenta
              </Link>
            </div>
          )}
        </div>

        {/* Menú hamburguesa (mobile) */}
        <button
          className="navbar-hamburguesa"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
