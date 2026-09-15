import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useParams,
  useNavigate,
} from 'react-router-dom';

import {
  verificarToken,
  getUsuarioLocal,
  logoutUsuario,
  obtenerProductos,
  toggleFavorito,
} from './services/api';

import ListaProductos from './components/ListaProductos';
import DetalleProducto from './components/DetalleProducto';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import LoginAdmin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import FormularioProducto from './pages/admin/FormularioProducto';
import MiCuenta from './pages/usuario/MiCuenta';
import Favoritos from './pages/usuario/Favoritos';

import './App.css';

/* ============================================================
   RutaProtegida — Redirects to /ingresar if not authenticated
   ============================================================ */
function RutaProtegida({ children }) {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    verificarToken()
      .then((valido) => {
        if (!cancelado) {
          setAutenticado(!!valido);
          setVerificando(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setAutenticado(false);
          setVerificando(false);
        }
      });
    return () => { cancelado = true; };
  }, []);

  if (verificando) {
    return (
      <div className="app-cargando">
        <div className="cargando-spinner" />
      </div>
    );
  }
  return autenticado ? children : <Navigate to="/ingresar" replace />;
}

/* ============================================================
   RutaAdmin — Protected + requires admin role
   ============================================================ */
function RutaAdmin({ children }) {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    verificarToken()
      .then((valido) => {
        if (!cancelado) {
          const usuario = getUsuarioLocal();
          setAutorizado(!!valido && usuario?.rol === 'admin');
          setVerificando(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setAutorizado(false);
          setVerificando(false);
        }
      });
    return () => { cancelado = true; };
  }, []);

  if (verificando) {
    return (
      <div className="app-cargando">
        <div className="cargando-spinner" />
      </div>
    );
  }
  return autorizado ? children : <Navigate to="/" replace />;
}

/* ============================================================
   useScrollReveal — IntersectionObserver for scroll animations
   ============================================================ */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const elementos = document.querySelectorAll('.reveal-on-scroll');
    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ============================================================
   NavTienda — Premium dark navigation bar (matching reference)
   ============================================================ */
function NavTienda({ usuario, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickFuera(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const cerrarMenus = useCallback(() => {
    setMenuAbierto(false);
    setDropdownAbierto(false);
  }, []);

  const handleLogoutClick = () => {
    cerrarMenus();
    onLogout();
    navigate('/');
  };

  return (
    <nav className="nav-tienda">
      <div className="nav-contenido">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={cerrarMenus}>
          <span className="nav-logo-icon">🧉</span>
          <span className="nav-logo-texto">Tienda Matecitos</span>
        </Link>

        {/* Center link */}
        <div className={`nav-center ${menuAbierto ? 'nav-center--abierto' : ''}`}>
          <a href="#productos" onClick={cerrarMenus}>Productos</a>
        </div>

        {/* Right side */}
        <div className="nav-derecha">
          {usuario ? (
            <div className="nav-usuario-wrap" ref={dropdownRef}>
              <button
                className="nav-avatar-btn"
                onClick={() => setDropdownAbierto((prev) => !prev)}
                aria-label="Menu de usuario"
              >
                <span className="nav-avatar">
                  {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="nav-avatar-nombre">
                  {usuario.rol === 'admin' ? 'Administrador' : usuario.nombre}
                </span>
                <svg className="nav-avatar-chevron" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className={`nav-dropdown ${dropdownAbierto ? 'visible' : ''}`}>
                <div className="nav-user-info">
                  <span className="nav-user-name">{usuario.nombre}</span>
                  <span className="nav-user-email">{usuario.email}</span>
                </div>
                <div className="nav-dropdown-divider" />

                {usuario.rol === 'admin' && (
                  <Link to="/admin" onClick={cerrarMenus}>Panel Admin</Link>
                )}
                <Link to="/mi-cuenta" onClick={cerrarMenus}>Mi Cuenta</Link>
                <Link to="/favoritos" onClick={cerrarMenus}>Mis Favoritos</Link>

                <div className="nav-dropdown-divider" />
                <button onClick={handleLogoutClick}>Cerrar Sesión</button>
              </div>
            </div>
          ) : (
            <Link to="/ingresar" className="nav-link-ingresar" onClick={cerrarMenus}>
              Ingresar
            </Link>
          )}

          {/* Cart icon */}
          <button className="nav-icon-btn" aria-label="Carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
          </button>

          {/* Search icon */}
          <button className="nav-icon-btn" aria-label="Buscar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Mobile hamburger */}
          <button
            className={`nav-hamburger ${menuAbierto ? 'nav-hamburger--abierto' : ''}`}
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   HeroCarousel — Promoted products with peek of next slide
   ============================================================ */
function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const intervaloRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    obtenerProductos({ promocionCentro: 'true' })
      .then((res) => {
        const productos = res?.datos || res || [];
        if (!cancelado && productos.length) {
          // Fisher-Yates shuffle
          const shuffled = [...productos];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          setSlides(shuffled);
        }
      })
      .catch(() => {});
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || pausado) return;
    intervaloRef.current = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(intervaloRef.current);
  }, [slides.length, pausado]);

  const irA = useCallback((i) => setIndiceActual(i), []);
  const anterior = useCallback(() => {
    setIndiceActual((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);
  const siguiente = useCallback(() => {
    setIndiceActual((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  /* Static fallback hero */
  if (!slides.length) {
    return (
      <section className="hero-static">
        <span className="hero-static-emoji">🧉</span>
        <h1 className="hero-static-titulo">El Ritual de Siempre, el Diseño de Hoy</h1>
        <p className="hero-static-subtitulo">
          Descubrí nuestra colección de mates artesanales y accesorios premium
        </p>
        <a href="#productos" className="hero-static-cta">Ver Productos</a>
      </section>
    );
  }

  // Slide width percentage (87% to allow 13% peek of next slide)
  const slideWidth = 87;

  return (
    <section
      className="hero-carousel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div
        className="carousel-track"
        style={{
          transform: `translateX(-${indiceActual * slideWidth}%)`,
        }}
      >
        {slides.map((producto, i) => {
          const heroUrl = producto.imagenHero?.url || '';
          const productImgs = producto.imagenes || [];
          return (
            <div
              className="carousel-slide"
              key={producto._id || i}
              style={{ minWidth: `${slideWidth}%` }}
            >
              {/* Background image (imagenHero) */}
              {heroUrl && (
                <img className="slide-bg" src={heroUrl} alt="" />
              )}
              {!heroUrl && (
                <div className="slide-bg-fallback" />
              )}
              <div className="slide-overlay" />

              {/* Left: Text Content */}
              <div className="slide-content">
                <div className="slide-texto">
                  {producto.categoria && (
                    <span className="slide-cat">{producto.categoria}</span>
                  )}
                  <h2 className="slide-titulo">{producto.nombre}</h2>
                  {producto.descripcion && (
                    <p className="slide-desc">{producto.descripcion}</p>
                  )}
                  <Link to={`/producto/${producto._id}`} className="slide-cta">
                    Ver Novedades y Tendencias
                  </Link>
                </div>

                {/* Right: Product images (desktop) */}
                {productImgs.length > 0 && (
                  <div className="slide-productos">
                    {productImgs.slice(0, 3).map((img, idx) => (
                      <div
                        className={`slide-producto-img slide-producto-img--${idx + 1}`}
                        key={img.publicId || idx}
                      >
                        <img src={img.url} alt={producto.nombre} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrow navigation */}
      {slides.length > 1 && (
        <>
          <button className="carousel-arrow prev" onClick={anterior} aria-label="Anterior">
            &#8249;
          </button>
          <button className="carousel-arrow next" onClick={siguiente} aria-label="Siguiente">
            &#8250;
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === indiceActual ? 'activo' : ''}`}
              onClick={() => irA(i)}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   SeccionCaracteristicas — Feature cards
   ============================================================ */
function SeccionCaracteristicas() {
  const caracteristicas = [
    { icon: '✦', titulo: 'Diseño Híbrido', desc: 'Texturas orgánicas tradicionales con acabados modernos y elegantes' },
    { icon: '◈', titulo: 'Funcionalidad', desc: 'Opciones térmicas y resistentes para la oficina, casa o viaje' },
    { icon: '◇', titulo: 'Estética Minimalista', desc: 'Formas geométricas y siluetas pulidas que complementan cualquier espacio' },
    { icon: '❖', titulo: 'Materiales Premium', desc: 'Desde alpaca cincelada hasta acero de doble pared de última generación' },
  ];

  return (
    <section className="seccion-features reveal-on-scroll">
      <div className="features-contenido">
        <h2 className="seccion-titulo">Nuestra Esencia</h2>
        <p className="seccion-subtitulo">Tradición y vanguardia en cada pieza</p>
        <div className="features-grid">
          {caracteristicas.map((item, i) => (
            <div className="feature-card reveal-on-scroll" key={i}>
              <span className="feature-icon">{item.icon}</span>
              <h3>{item.titulo}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HomePage — Public storefront landing page
   ============================================================ */
function HomePage({ usuario, favoritos, onLogout, onToggleFav }) {
  useScrollReveal();
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Product detail modal overlay */}
      {id && (
        <div className="detalle-overlay" onClick={() => navigate('/')}>
          <div className="detalle-overlay-contenido" onClick={(e) => e.stopPropagation()}>
            <DetalleProducto />
          </div>
        </div>
      )}

      <NavTienda usuario={usuario} onLogout={onLogout} />
      <HeroCarousel />
      <SeccionCaracteristicas />

      {/* Product listing */}
      <section id="productos" className="seccion-productos reveal-on-scroll">
        <h2 className="seccion-titulo">Nuestros Productos</h2>
        <ListaProductos
          usuario={usuario}
          favoritos={favoritos}
          onToggleFav={onToggleFav}
        />
      </section>

      {/* WhatsApp CTA */}
      <section className="seccion-whatsapp reveal-on-scroll">
        <div className="whatsapp-contenido">
          <h2>¿Tenés alguna consulta?</h2>
          <p>Escribinos por WhatsApp y te asesoramos con la mejor opción para vos</p>
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chateanos por WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-contenido">
          <div className="footer-marca">
            <span>🧉</span>
            <span>Tienda Matecitos</span>
          </div>
          <p className="footer-texto">
            Un clásico reimaginado — Mates creados para protagonizar tus mejores momentos
          </p>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} Tienda Matecitos — Hecho con 🧉 en Argentina
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   App — Root component with routing and global auth state
   ============================================================ */
function App() {
  const [usuario, setUsuario] = useState(null);
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    const user = getUsuarioLocal();
    if (user) {
      setUsuario(user);
      verificarToken()
        .then((valido) => {
          if (valido) {
            if (user.favoritos) setFavoritos(user.favoritos);
          } else {
            logoutUsuario();
            setUsuario(null);
          }
        })
        .catch(() => {
          logoutUsuario();
          setUsuario(null);
        });
    }
  }, []);

  const handleLogin = useCallback((user) => {
    setUsuario(user);
    if (user?.favoritos) setFavoritos(user.favoritos);
  }, []);

  const handleLogout = useCallback(() => {
    logoutUsuario();
    setUsuario(null);
    setFavoritos([]);
  }, []);

  const handleToggleFav = useCallback(async (productoId) => {
    try {
      const res = await toggleFavorito(productoId);
      if (res?.favoritos) {
        setFavoritos(res.favoritos);
        const user = getUsuarioLocal();
        if (user) {
          user.favoritos = res.favoritos;
          localStorage.setItem('user_data', JSON.stringify(user));
          setUsuario({ ...user });
        }
      }
    } catch { /* non-critical */ }
  }, []);

  const handleActualizarUsuario = useCallback((u) => setUsuario(u), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage usuario={usuario} favoritos={favoritos} onLogout={handleLogout} onToggleFav={handleToggleFav} />} />
        <Route path="/producto/:id" element={<HomePage usuario={usuario} favoritos={favoritos} onLogout={handleLogout} onToggleFav={handleToggleFav} />} />
        <Route path="/ingresar" element={<Login onLogin={handleLogin} />} />
        <Route path="/registro" element={<Registro onLogin={handleLogin} />} />
        <Route path="/mi-cuenta" element={<RutaProtegida><MiCuenta usuario={usuario} onActualizarUsuario={handleActualizarUsuario} /></RutaProtegida>} />
        <Route path="/favoritos" element={<RutaProtegida><Favoritos usuario={usuario} favoritos={favoritos} onToggleFav={handleToggleFav} /></RutaProtegida>} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/admin" element={<RutaAdmin><Dashboard /></RutaAdmin>} />
        <Route path="/admin/nuevo" element={<RutaAdmin><FormularioProducto /></RutaAdmin>} />
        <Route path="/admin/editar/:id" element={<RutaAdmin><FormularioProducto /></RutaAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
