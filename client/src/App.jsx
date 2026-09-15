import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { verificarToken } from './services/api';
import ListaProductos from './components/ListaProductos';
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
    return <div className="app-cargando">Verificando sesión...</div>;
  }

  return autenticado ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tienda pública */}
        <Route
          path="/"
          element={
            <div className="app">
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
                <ListaProductos />
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

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
