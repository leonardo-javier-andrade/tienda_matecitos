import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  verificarToken,
  logoutUsuario,
  getUsuarioLocal,
  toggleFavorito,
} from './services/api';
import Navbar from './components/Navbar';
import ListaProductos from './components/ListaProductos';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import LoginAdmin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import FormularioProducto from './pages/admin/FormularioProducto';
import MiCuenta from './pages/usuario/MiCuenta';
import Favoritos from './pages/usuario/Favoritos';
import './App.css';

// Componente que protege rutas de admin
function RutaProtegida({ children, usuario, rolRequerido }) {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    verificarToken().then((data) => {
      const valido = data.valido && (!rolRequerido || data.usuario?.rol === rolRequerido);
      setAutenticado(valido);
      setVerificando(false);
    });
  }, [rolRequerido]);

  if (verificando) {
    return <div className="app-cargando">Verificando sesión...</div>;
  }

  if (!autenticado) {
    return <Navigate to="/ingresar" replace />;
  }

  return children;
}

// Componente que redirige si ya está logueado
function RutaPublica({ children, usuario }) {
  if (usuario) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Verificar sesión al montar
  useEffect(() => {
    const verificarSesion = async () => {
      const usuarioLocal = getUsuarioLocal();
      if (usuarioLocal) {
        setUsuario(usuarioLocal);
        setFavoritos(usuarioLocal.favoritos || []);
      }

      try {
        const data = await verificarToken();
        if (data.valido && data.usuario) {
          setUsuario(data.usuario);
          setFavoritos(data.usuario.favoritos || []);
        } else {
          setUsuario(null);
          setFavoritos([]);
          logoutUsuario();
        }
      } catch {
        // Token inválido, limpiar
        setUsuario(null);
        logoutUsuario();
      }
      setCargando(false);
    };

    verificarSesion();
  }, []);

  const handleLogin = (usuarioData, token) => {
    setUsuario(usuarioData);
    setFavoritos(usuarioData.favoritos || []);
  };

  const handleLogout = () => {
    logoutUsuario();
    setUsuario(null);
    setFavoritos([]);
  };

  const handleActualizarUsuario = (usuarioActualizado) => {
    setUsuario(usuarioActualizado);
  };

  const handleToggleFav = async (productoId) => {
    // Actualizar localmente para respuesta inmediata
    setFavoritos((prev) => {
      if (prev.includes(productoId)) {
        return prev.filter((id) => id !== productoId);
      } else {
        return [...prev, productoId];
      }
    });
  };

  if (cargando) {
    return <div className="app-cargando">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Tienda pública ─────────────────── */}
        <Route
          path="/"
          element={
            <div className="app">
              <Navbar usuario={usuario} onLogout={handleLogout} />

              <header className="app-header">
                <div className="header-contenido">
                  <h1>🧉 Tienda Matecitos</h1>
                  <p>
                    Mates, bombillas y todo lo que necesitás para disfrutar un
                    buen mate
                  </p>
                </div>
              </header>

              <main>
                <ListaProductos
                  usuario={usuario}
                  favoritos={favoritos}
                  onToggleFav={handleToggleFav}
                />
              </main>

              <footer className="app-footer">
                <p>
                  © {new Date().getFullYear()} Tienda Matecitos — Hecho con 🧉
                  en Argentina
                </p>
              </footer>
            </div>
          }
        />

        {/* ─── Auth ───────────────────────────── */}
        <Route
          path="/ingresar"
          element={
            <RutaPublica usuario={usuario}>
              <Login onLogin={handleLogin} />
            </RutaPublica>
          }
        />
        <Route
          path="/registro"
          element={
            <RutaPublica usuario={usuario}>
              <Registro onLogin={handleLogin} />
            </RutaPublica>
          }
        />

        {/* Redirección del viejo login admin */}
        <Route path="/admin/login" element={<LoginAdmin />} />

        {/* ─── Usuario ────────────────────────── */}
        <Route
          path="/mi-cuenta"
          element={
            <div className="app">
              <Navbar usuario={usuario} onLogout={handleLogout} />
              <main>
                <RutaProtegida usuario={usuario}>
                  <MiCuenta
                    usuario={usuario}
                    onActualizarUsuario={handleActualizarUsuario}
                  />
                </RutaProtegida>
              </main>
            </div>
          }
        />
        <Route
          path="/favoritos"
          element={
            <div className="app">
              <Navbar usuario={usuario} onLogout={handleLogout} />
              <main>
                <RutaProtegida usuario={usuario}>
                  <Favoritos
                    usuario={usuario}
                    favoritos={favoritos}
                    onToggleFav={handleToggleFav}
                  />
                </RutaProtegida>
              </main>
            </div>
          }
        />

        {/* ─── Admin ──────────────────────────── */}
        <Route
          path="/admin"
          element={
            <RutaProtegida usuario={usuario} rolRequerido="admin">
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/nuevo"
          element={
            <RutaProtegida usuario={usuario} rolRequerido="admin">
              <FormularioProducto />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/editar/:id"
          element={
            <RutaProtegida usuario={usuario} rolRequerido="admin">
              <FormularioProducto />
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
