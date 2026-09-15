const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Obtener todos los productos, con filtros opcionales.
 * @param {Object} filtros - { categoria, destacado }
 */
export const obtenerProductos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const respuesta = await fetch(`${API_URL}/api/products?${params}`);

  if (!respuesta.ok) {
    throw new Error('Error al obtener los productos');
  }

  return respuesta.json();
};

/**
 * Obtener un producto por su ID.
 * @param {string} id
 */
export const obtenerProductoPorId = async (id) => {
  const respuesta = await fetch(`${API_URL}/api/products/${id}`);

  if (!respuesta.ok) {
    throw new Error('Error al obtener el producto');
  }

  return respuesta.json();
};

/**
 * Verificar el estado de la API.
 */
export const verificarEstadoAPI = async () => {
  const respuesta = await fetch(`${API_URL}/api/status`);
  return respuesta.json();
};
