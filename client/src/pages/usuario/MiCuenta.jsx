import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { actualizarPerfil } from '../../services/api';
import './MiCuenta.css';

function MiCuenta({ usuario, onActualizarUsuario }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    telefono: usuario?.telefono || '',
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  if (!usuario) {
    navigate('/ingresar');
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    try {
      const resultado = await actualizarPerfil(form);
      if (resultado.exito) {
        setMensaje('Perfil actualizado correctamente.');
        setEditando(false);
        if (onActualizarUsuario) onActualizarUsuario(resultado.usuario);
      } else {
        setError(resultado.mensaje);
      }
    } catch {
      setError('Error al actualizar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="micuenta-container">
      <div className="micuenta-card">
        <div className="micuenta-avatar">
          <span>{usuario.nombre.charAt(0).toUpperCase()}</span>
        </div>

        <h1>Mi Cuenta</h1>

        {mensaje && <div className="micuenta-exito">{mensaje}</div>}
        {error && <div className="micuenta-error">{error}</div>}

        {!editando ? (
          <div className="micuenta-info">
            <div className="micuenta-campo">
              <span className="campo-label">Nombre</span>
              <span className="campo-valor">{usuario.nombre}</span>
            </div>
            <div className="micuenta-campo">
              <span className="campo-label">Email</span>
              <span className="campo-valor">{usuario.email}</span>
            </div>
            <div className="micuenta-campo">
              <span className="campo-label">Teléfono</span>
              <span className="campo-valor">{usuario.telefono || 'No registrado'}</span>
            </div>
            <div className="micuenta-campo">
              <span className="campo-label">Tipo de cuenta</span>
              <span className={`campo-rol ${usuario.rol}`}>
                {usuario.rol === 'admin' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
            <div className="micuenta-campo">
              <span className="campo-label">Miembro desde</span>
              <span className="campo-valor">
                {new Date(usuario.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <button className="micuenta-btn editar" onClick={() => setEditando(true)}>
              Editar Perfil
            </button>
          </div>
        ) : (
          <form className="micuenta-form" onSubmit={handleGuardar}>
            <div className="auth-campo">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-campo">
              <label>Email</label>
              <input type="email" value={usuario.email} disabled className="campo-disabled" />
            </div>

            <div className="auth-campo">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="micuenta-form-acciones">
              <button type="submit" className="micuenta-btn guardar" disabled={cargando}>
                {cargando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                className="micuenta-btn cancelar"
                onClick={() => {
                  setEditando(false);
                  setForm({ nombre: usuario.nombre, telefono: usuario.telefono || '' });
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default MiCuenta;
