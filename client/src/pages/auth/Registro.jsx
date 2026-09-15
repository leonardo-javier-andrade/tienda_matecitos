import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrarUsuario } from '../../services/api';
import './Auth.css';

function Registro({ onLogin }) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      const resultado = await registrarUsuario({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
      });

      if (resultado.exito) {
        onLogin(resultado.usuario, resultado.token);
        navigate('/');
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
          <h1>Crear Cuenta</h1>
          <p>Registrate para guardar favoritos y comprar</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-campo">
          <label htmlFor="nombre">Nombre completo</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            autoFocus
          />
        </div>

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
          />
        </div>

        <div className="auth-campo">
          <label htmlFor="telefono">Teléfono (opcional)</label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            placeholder="+54 9 11 1234-5678"
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
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div className="auth-campo">
          <label htmlFor="confirmarPassword">Confirmar contraseña</label>
          <input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            value={form.confirmarPassword}
            onChange={handleChange}
            placeholder="Repetí la contraseña"
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>

        <div className="auth-links">
          <p>
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingresar" className="auth-link">
              Iniciar sesión
            </Link>
          </p>
          <Link to="/" className="auth-volver">← Volver a la tienda</Link>
        </div>
      </form>
    </div>
  );
}

export default Registro;
