import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  verificarToken,
  logoutUsuario,
  getUsuarioLocal,
  obtenerHeroSlides,
} from './services/api';
import ListaProductos from './components/ListaProductos';
import DetalleProducto from './components/DetalleProducto';
import LoginAuth from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Dashboard from './pages/admin/Dashboard';
import FormularioProducto from './pages/admin/FormularioProducto';
import GestionCategorias from './pages/admin/GestionCategorias';
import GestionHero from './pages/admin/GestionHero';
import './App.css';

// ─── Auth guard ───────────────────────────────────────
function RutaProtegida({ children }) {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    verificarToken().then((data) => {
      setAutenticado(data.valido);
      setVerificando(false);
    });
  }, []);

  if (verificando) {
    return (
      <div className="app-cargando">
        <div className="cargando-spinner" />
        Verificando sesion...
      </div>
    );
  }

  return autenticado ? children : <Navigate to="/ingresar" replace />;
}

// ─── NavTienda ────────────────────────────────────────
function NavTienda() {
  const [usuario, setUsuario] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    verificarToken().then((data) => {
      if (data.valido) setUsuario(data.usuario);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logoutUsuario();
    setUsuario(null);
    setDropdownAbierto(false);
    navigate('/');
  };

  const inicialNombre = usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?';

  return (
    <nav className="nav-tienda">
      <div className="nav-contenido">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🧉</span>
          <span className="nav-logo-texto">Matecitos</span>
        </Link>

        {/* Center links (desktop) */}
        <div className={`nav-center ${menuAbierto ? 'nav-center--abierto' : ''}`}>
          <a href="#productos" onClick={() => setMenuAbierto(false)}>Productos</a>
        </div>

        {/* Right */}
        <div className="nav-derecha">
          {usuario ? (
            <div className="nav-usuario-wrap" ref={dropdownRef}>
              <button
                className="nav-avatar-btn"
                onClick={() => setDropdownAbierto(!dropdownAbierto)}
              >
                <span className="nav-avatar">{inicialNombre}</span>
                <span className="nav-avatar-nombre">{usuario.nombre}</span>
                <svg className="nav-avatar-chevron" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className={`nav-dropdown ${dropdownAbierto ? 'visible' : ''}`}>
                <div className="nav-user-info">
                  <span className="nav-user-name">{usuario.nombre}</span>
                  <span className="nav-user-email">{usuario.email}</span>
                </div>
                {usuario.rol === 'admin' && (
                  <Link to="/admin" onClick={() => setDropdownAbierto(false)}>
                    Panel Admin
                  </Link>
                )}
                <div className="nav-dropdown-divider" />
                <button onClick={handleLogout}>Cerrar sesion</button>
              </div>
            </div>
          ) : (
            <Link to="/ingresar" className="nav-link-ingresar">
              Ingresar
            </Link>
          )}

          {/* Hamburger (mobile) */}
          <button
            className={`nav-hamburger ${menuAbierto ? 'nav-hamburger--abierto' : ''}`}
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── HeroCarousel ─────────────────────────────────────
function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [indice, setIndice] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    obtenerHeroSlides()
      .then((res) => {
        if (res.exito && res.datos) setSlides(res.datos);
      })
      .catch(() => {});
  }, []);

  const total = slides.length;

  const avanzar = useCallback(() => {
    if (total <= 1) return;
    setIndice((prev) => (prev + 1) % total);
  }, [total]);

  const retroceder = useCallback(() => {
    if (total <= 1) return;
    setIndice((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(avanzar, 6000);
    return () => clearInterval(timerRef.current);
  }, [total, avanzar]);

  const irA = (i) => {
    setIndice(i);
    // Reset auto-advance timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(avanzar, 6000);
  };

  // No slides → static fallback
  if (total === 0) {
    return (
      <section className="hero-static">
        <span className="hero-static-emoji">🧉</span>
        <h1 className="hero-static-titulo">Tienda Matecitos</h1>
        <p className="hero-static-subtitulo">
          Mates artesanales, bombillas, termos y todo lo que necesitas para disfrutar
          un buen mate argentino.
        </p>
        <a href="#productos" className="hero-static-cta">
          Ver productos →
        </a>
      </section>
    );
  }

  const slideWidth = total > 1 ? 87 : 100;

  return (
    <section className="hero-carousel">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${indice * slideWidth}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide._id}
            className="carousel-slide"
            style={{ minWidth: `${slideWidth}%` }}
          >
            {slide.imagenFondo?.url ? (
              <img
                className="slide-bg"
                src={slide.imagenFondo.url}
                alt={slide.titulo}
                loading="lazy"
              />
            ) : (
              <div className="slide-bg-fallback" />
            )}

            <div className="slide-overlay" />

            <div className="slide-content">
              <div className="slide-texto">
                <span className="slide-cat">Matecitos</span>
                <h2 className="slide-titulo">{slide.titulo}</h2>
                {slide.descripcion && (
                  <p className="slide-desc">{slide.descripcion}</p>
                )}
                {slide.enlace && (
                  <a href={slide.enlace} className="slide-cta">
                    {slide.textoBoton || 'Ver mas'} →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button className="carousel-arrow prev" onClick={() => { retroceder(); irA((indice - 1 + total) % total); }} aria-label="Anterior">
            ‹
          </button>
          <button className="carousel-arrow next" onClick={() => { avanzar(); irA((indice + 1) % total); }} aria-label="Siguiente">
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === indice ? 'activo' : ''}`}
              onClick={() => irA(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── SeccionCaracteristicas ───────────────────────────
function SeccionCaracteristicas() {
  const features = [
    { icon: '🧉', titulo: 'Artesanal', desc: 'Cada mate es unico, hecho a mano con materiales de primera calidad.' },
    { icon: '🚚', titulo: 'Envio a todo el pais', desc: 'Enviamos tu pedido a cualquier punto de Argentina.' },
    { icon: '💬', titulo: 'Atencion por WhatsApp', desc: 'Consultas, pedidos y seguimiento por WhatsApp.' },
    { icon: '⭐', titulo: 'Calidad garantizada', desc: 'Productos seleccionados con garantia de satisfaccion.' },
  ];

  return (
    <section className="seccion-features reveal-on-scroll">
      <div className="features-contenido">
        <h2 className="seccion-titulo">¿Por que elegirnos?</h2>
        <p className="seccion-subtitulo">Todo lo que necesitas para el mejor mate</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.titulo}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SeccionWhatsApp ──────────────────────────────────
function SeccionWhatsApp() {
  return (
    <section className="seccion-whatsapp reveal-on-scroll">
      <div className="whatsapp-contenido">
        <h2>¿Tenes alguna consulta?</h2>
        <p>Escribinos por WhatsApp y te ayudamos a elegir el mate perfecto para vos.</p>
        <a
          href="https://wa.me/5491100000000"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Escribinos por WhatsApp
        </a>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────
function FooterTienda() {
  return (
    <footer className="app-footer">
      <div className="footer-contenido">
        <div className="footer-marca">
          <span>🧉</span>
          <span>Matecitos</span>
        </div>
        <p className="footer-texto">
          Mates artesanales y accesorios para disfrutar el mejor mate argentino.
        </p>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Tienda Matecitos — Hecho en Argentina
        </p>
      </div>
    </footer>
  );
}

// ─── HomePage ─────────────────────────────────────────
function HomePage() {
  // Scroll reveal observer
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      <NavTienda />
      <HeroCarousel />

      {/* Products */}
      <section id="productos" className="seccion-productos reveal-on-scroll">
        <h2 className="seccion-titulo">Nuestros Productos</h2>
        <p className="seccion-subtitulo">Encontra el mate perfecto para vos</p>
        <ListaProductos />
      </section>

      <SeccionCaracteristicas />
      <SeccionWhatsApp />
      <FooterTienda />
    </div>
  );
}

// ─── LoginWrapper ─────────────────────────────────────
function LoginWrapper() {
  const navigate = useNavigate();

  const handleLogin = (usuario, token) => {
    // loginUsuario ya guarda token y usuario en localStorage
    // solo navegamos segun el rol
    if (usuario.rol === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return <LoginAuth onLogin={handleLogin} />;
}

// ─── App ──────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tienda publica */}
        <Route path="/" element={<HomePage />} />

        {/* Detalle de producto (modal overlay) */}
        <Route
          path="/producto/:id"
          element={
            <>
              <HomePage />
              <DetalleProducto />
            </>
          }
        />

        {/* Auth */}
        <Route path="/ingresar" element={<LoginWrapper />} />
        <Route path="/registro" element={<Registro />} />
        {/* Redirigir ruta vieja de admin/login */}
        <Route path="/admin/login" element={<Navigate to="/ingresar" replace />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/nuevo"
          element={
            <RutaProtegida>
              <FormularioProducto />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/editar/:id"
          element={
            <RutaProtegida>
              <FormularioProducto />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <RutaProtegida>
              <GestionCategorias />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/hero"
          element={
            <RutaProtegida>
              <GestionHero />
            </RutaProtegida>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
