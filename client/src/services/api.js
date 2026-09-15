const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Helpers ───────────────────────────────────────────

const getToken = () => localStorage.getItem('user_token');

const headersConAuth = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// ─── Auth (unificado) ──────────────────────────────────

export const loginUsuario = async (email, password) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.exito) {
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(data.usuario));
  }
  return data;
};

export const registrarUsuario = async ({ nombre, email, password, telefono }) => {
  const res = await fetch(`${API_URL}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password, telefono }),
  });
  const data = await res.json();
  if (data.exito) {
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(data.usuario));
  }
  return data;
};

export const verificarToken = async () => {
  const token = getToken();
  if (!token) return { valido: false };
  try {
    const res = await fetch(`${API_URL}/api/auth/verificar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.valido) {
      localStorage.setItem('user_data', JSON.stringify(data.usuario));
    }
    return data;
  } catch {
    return { valido: false };
  }
};

export const logoutUsuario = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_data');
};

export const getUsuarioLocal = () => {
  try {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// ─── Perfil ────────────────────────────────────────────

export const actualizarPerfil = async ({ nombre, telefono }) => {
  const res = await fetch(`${API_URL}/api/auth/perfil`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify({ nombre, telefono }),
  });
  const data = await res.json();
  if (data.exito) {
    localStorage.setItem('user_data', JSON.stringify(data.usuario));
  }
  return data;
};

// ─── Favoritos ─────────────────────────────────────────

export const toggleFavorito = async (productoId) => {
  const res = await fetch(`${API_URL}/api/auth/favorito/${productoId}`, {
    method: 'POST',
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerFavoritos = async () => {
  const res = await fetch(`${API_URL}/api/auth/favoritos`, {
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Productos (público) ──────────────────────────────

export const obtenerProductos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/products?${params}`);
  if (!res.ok) throw new Error('Error al obtener los productos');
  return res.json();
};

export const obtenerProductoPorId = async (id) => {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error('Error al obtener el producto');
  return res.json();
};

// ─── Productos (admin) ────────────────────────────────

export const obtenerTodosProductos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/products/admin/todos?${params}`, {
    headers: headersConAuth(),
  });
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};

export const crearProducto = async (producto) => {
  const res = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(producto),
  });
  return res.json();
};

export const actualizarProducto = async (id, producto) => {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify(producto),
  });
  return res.json();
};

export const eliminarProducto = async (id) => {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Upload de archivos ───────────────────────────────

export const subirArchivos = async (archivos) => {
  const formData = new FormData();
  for (const archivo of archivos) {
    formData.append('archivos', archivo);
  }

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });
  return res.json();
};

export const eliminarArchivo = async (publicId, tipo = 'imagen') => {
  const params = new URLSearchParams({ publicId, tipo }).toString();
  const res = await fetch(`${API_URL}/api/upload?${params}`, {
    method: 'DELETE',
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Admin seed ───────────────────────────────────────

export const crearAdminInicial = async () => {
  const res = await fetch(`${API_URL}/api/auth/seed-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
};

// ─── Verificar estado ─────────────────────────────────

export const verificarEstadoAPI = async () => {
  const res = await fetch(`${API_URL}/api/status`);
  return res.json();
};
