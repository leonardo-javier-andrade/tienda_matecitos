import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirige al login unificado.
 * Esta ruta se mantiene por compatibilidad con bookmarks/links existentes.
 */
function LoginAdmin() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/ingresar', { replace: true });
  }, [navigate]);

  return null;
}

export default LoginAdmin;
