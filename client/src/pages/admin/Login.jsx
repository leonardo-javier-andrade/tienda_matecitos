import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/api';
import './Login.css';

function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const resultado = await loginAdmin(password);
      if (resultado.exito) {
        navigate('/admin');
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
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-header">
          <span className="login-icon">🧉</span>
          <h1>Panel Admin</h1>
          <p>Tienda Matecitos</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="login-campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresá la contraseña de administrador"
            required
            autoFocus
          />
        </div>

        <button type="submit" className="login-btn" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <a href="/" className="login-volver">← Volver a la tienda</a>
      </form>
    </div>
  );
}

export default Login;
