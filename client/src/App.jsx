import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { verificarToken } from './services/api';
import ListaProductos from './components/ListaProductos';
import DetalleProducto from './components/DetalleProducto';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import FormularioProducto from './pages/admin/FormularioProducto';
import './App.css';

// Componente que protege rutas de admin
function RutaProtegida({ children }) {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    verificarToken().then((valido) => {
      setAutenticado(valido);
      setVerificando(false);
    });
  }, []);

  if (verificando) {
    return <div className="app-cargando"><div className="cargando-spinner" /><span>Verificando sesión...</span></div>;
  }

  return autenticado ? children : <Navigate to="/admin/login" replace />;
}

// Hook para detectar scroll y activar animaciones
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

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}

// Componente Hero animado
function HeroSection() {
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="hero" ref={heroRef}>
      <div className="hero-bg" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
      <div className="hero-overlay" />
      <div className="hero-contenido">
        <span className="hero-emoji animate-in">🧉</span>
        <h1 className="hero-titulo animate-in animate-in-delay-1">Tienda Matecitos</h1>
        <p className="hero-subtitulo animate-in animate-in-delay-2">
          El Ritual de Siempre, el Diseño de Hoy
        </p>
        <p className="hero-descripcion animate-in animate-in-delay-3">
          Fusionamos la calidez de los materiales clásicos con líneas limpias y contemporáneas.
          Cada pieza honra nuestras raíces y se adapta a tu estilo de vida moderno.
        </p>
        <a href="#productos" className="hero-cta animate-in animate-in-delay-4">
          Explorar Colección
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </header>
  );
}

// Sección de características
function SeccionCaracteristicas() {
  const features = [
    { icon: '✦', titulo: 'Diseño Híbrido', desc: 'Texturas orgánicas tradicionales con acabados modernos y elegantes' },
    { icon: '◈', titulo: 'Funcionalidad', desc: 'Opciones térmicas y resistentes para la oficina, casa o viaje' },
    { icon: '◇', titulo: 'Estética Minimalista', desc: 'Formas geométricas y siluetas pulidas que complementan cualquier espacio' },
    { icon: '❖', titulo: 'Materiales Premium', desc: 'Desde alpaca cincelada hasta acero de doble pared de última generación' },
  ];

  return (
    <section className="seccion-features">
      <div className="features-contenido">
        <h2 className="seccion-titulo reveal-on-scroll">Nuestra Esencia</h2>
        <p className="seccion-subtitulo reveal-on-scroll">Tradición y vanguardia en cada pieza</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card reveal-on-scroll" style={{ animationDelay: `${i * 0.1}s` }}>
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

function HomePage() {
  useScrollReveal();
  const { id } = useParams();

  return (
    <div className="app">
      {/* Modal de detalle de producto */}
      {id && <DetalleProducto />}

      <nav className="nav-tienda">
        <div className="nav-contenido">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">🧉</span>
            <span className="nav-logo-texto">Matecitos</span>
          </Link>
          <div className="nav-links">
            <a href="#productos" className="nav-link">Productos</a>
            <Link to="/admin/login" className="nav-link nav-link-admin">Admin</Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <SeccionCaracteristicas />

      <main id="productos">
        <ListaProductos />
      </main>

      {/* Banner de WhatsApp */}
      <section className="seccion-whatsapp reveal-on-scroll">
        <div className="whatsapp-contenido">
          <h2>¿Tenés alguna consulta?</h2>
          <p>Escribinos por WhatsApp y te asesoramos con la mejor opción para vos</p>
          <a
            href="https://wa.me/5491100000000?text=Hola!%20Quiero%20consultar%20por%20un%20producto"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.3 0-4.438-.762-6.154-2.048l-.43-.324-2.655.89.89-2.655-.324-.43A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Consultá por WhatsApp
          </a>
        </div>
      </section>

      <footer className="app-footer">
        <div className="footer-contenido">
          <div className="footer-marca">
            <span>🧉</span>
            <span>Tienda Matecitos</span>
          </div>
          <p className="footer-texto">
            Un clásico reimaginado — Mates creados para protagonizar tus mejores momentos
          </p>
          <p className="footer-copy">
            © {new Date().getFullYear()} Tienda Matecitos — Hecho con 🧉 en Argentina
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tienda pública */}
        <Route path="/" element={<HomePage />} />
        <Route path="/producto/:id" element={<HomePage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={<RutaProtegida><Dashboard /></RutaProtegida>}
        />
        <Route
          path="/admin/nuevo"
          element={<RutaProtegida><FormularioProducto /></RutaProtegida>}
        />
        <Route
          path="/admin/editar/:id"
          element={<RutaProtegida><FormularioProducto /></RutaProtegida>}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
