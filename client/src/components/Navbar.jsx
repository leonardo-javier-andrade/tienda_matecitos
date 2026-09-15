import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ usuario, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mobileMenuAbierto, setMobileMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
    setMobileMenuAbierto(false);
  }, [location.pathname]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Bloquear scroll del body cuando el menú mobile está abierto
  useEffect(() => {
    if (mobileMenuAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuAbierto]);

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

        {/* Links de navegación (desktop) */}
        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'activo' : ''}`}>
            Productos
          </Link>
        </div>

        {/* Sección de usuario (desktop) */}
        <div className="navbar-usuario-desktop" ref={menuRef}>
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

        {/* Botón hamburguesa (mobile) */}
        <button
          className={`navbar-hamburguesa ${mobileMenuAbierto ? 'activo' : ''}`}
          onClick={() => setMobileMenuAbierto(!mobileMenuAbierto)}
          aria-label="Menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menú mobile overlay */}
      {mobileMenuAbierto && (
        <div className="navbar-mobile-overlay" onClick={() => setMobileMenuAbierto(false)}>
          <div className="navbar-mobile-menu" onClick={(e) => e.stopPropagation()}>
            {usuario ? (
              <>
                <div className="mobile-usuario-info">
                  <span className="navbar-avatar mobile-avatar">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="mobile-nombre">{usuario.nombre}</span>
                    <span className={`dropdown-rol ${usuario.rol}`}>
                      {usuario.rol === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </div>
                </div>
                <div className="mobile-divider" />

                <Link to="/" className="mobile-link">
                  🏠 Productos
                </Link>

                {usuario.rol === 'admin' && (
                  <Link to="/admin" className="mobile-link">
                    📊 Panel Admin
                  </Link>
                )}

                <Link to="/mi-cuenta" className="mobile-link">
                  👤 Mi Cuenta
                </Link>

                <Link to="/favoritos" className="mobile-link">
                  ❤️ Mis Favoritos
                </Link>

                <div className="mobile-divider" />
                <button className="mobile-link mobile-logout" onClick={handleLogout}>
                  🚪 Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="mobile-link">
                  🏠 Productos
                </Link>
                <div className="mobile-divider" />
                <Link to="/ingresar" className="mobile-link">
                  🔑 Ingresar
                </Link>
                <Link to="/registro" className="mobile-link mobile-registro">
                  ✨ Crear Cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
