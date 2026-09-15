const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Helpers ───────────────────────────────────────────

const getToken = () => localStorage.getItem('admin_token');

const headersConAuth = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// ─── Auth ──────────────────────────────────────────────

export const loginAdmin = async (password) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (data.exito) {
    localStorage.setItem('admin_token', data.token);
  }
  return data;
};

export const verificarToken = async () => {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/api/auth/verificar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.valido;
  } catch {
    return false;
  }
};

export const logoutAdmin = () => {
  localStorage.removeItem('admin_token');
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

// ─── Verificar estado ─────────────────────────────────

export const verificarEstadoAPI = async () => {
  const res = await fetch(`${API_URL}/api/status`);
  return res.json();
};
