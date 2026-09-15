import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUsuario } from '../../services/api';
import './Auth.css';

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const resultado = await loginUsuario(form.email, form.password);
      if (resultado.exito) {
        onLogin(resultado.usuario, resultado.token);
        // Redirigir según rol
        if (resultado.usuario.rol === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(resultado.mensaje);
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-header">
          <span className="auth-icon">🧉</span>
          <h1>Iniciar Sesión</h1>
          <p>Ingresá a tu cuenta en Tienda Matecitos</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-campo">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            autoFocus
          />
        </div>

        <div className="auth-campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Tu contraseña"
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="auth-links">
          <p>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="auth-link">
              Crear cuenta
            </Link>
          </p>
          <Link to="/" className="auth-volver">← Volver a la tienda</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
