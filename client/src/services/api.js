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

// ─── Productos (publico) ──────────────────────────────

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

// ─── Categorias (publico) ─────────────────────────────

export const obtenerCategorias = async () => {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error('Error al obtener categorias');
  return res.json();
};

// ─── Categorias (admin) ──────────────────────────────

export const obtenerTodasCategorias = async () => {
  const res = await fetch(`${API_URL}/api/categories/admin/todas`, {
    headers: headersConAuth(),
  });
  if (!res.ok) throw new Error('Error al obtener categorias');
  return res.json();
};

export const crearCategoria = async (categoria) => {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(categoria),
  });
  return res.json();
};

export const actualizarCategoria = async (id, categoria) => {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify(categoria),
  });
  return res.json();
};

export const eliminarCategoria = async (id) => {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Hero Slides (publico) ────────────────────────────

export const obtenerHeroSlides = async () => {
  const res = await fetch(`${API_URL}/api/hero`);
  if (!res.ok) throw new Error('Error al obtener slides del hero');
  return res.json();
};

// ─── Hero Slides (admin) ─────────────────────────────

export const obtenerTodosHeroSlides = async () => {
  const res = await fetch(`${API_URL}/api/hero/admin/todos`, {
    headers: headersConAuth(),
  });
  if (!res.ok) throw new Error('Error al obtener slides del hero');
  return res.json();
};

export const crearHeroSlide = async (slide) => {
  const res = await fetch(`${API_URL}/api/hero`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(slide),
  });
  return res.json();
};

export const actualizarHeroSlide = async (id, slide) => {
  const res = await fetch(`${API_URL}/api/hero/${id}`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify(slide),
  });
  return res.json();
};

export const eliminarHeroSlide = async (id) => {
  const res = await fetch(`${API_URL}/api/hero/${id}`, {
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



// ─── Envíos (EnvioPack) ───────────────────────────────

export const obtenerProvincias = async () => {
  const res = await fetch(`${API_URL}/api/shipping/provincias`);
  return res.json();
};

export const obtenerLocalidades = async (provinciaId) => {
  const res = await fetch(`${API_URL}/api/shipping/localidades?provincia=${provinciaId}`);
  return res.json();
};

export const cotizarEnvio = async ({ provincia, codigo_postal, peso }) => {
  const params = new URLSearchParams({ provincia, codigo_postal, peso: peso.toString() });
  const res = await fetch(`${API_URL}/api/shipping/cotizar?${params}`);
  return res.json();
};

export const cotizarEnvioSucursal = async ({ provincia, localidad, peso }) => {
  const params = new URLSearchParams({ provincia, localidad, peso: peso.toString() });
  const res = await fetch(`${API_URL}/api/shipping/cotizar-sucursal?${params}`);
  return res.json();
};

// ─── Checkout (MercadoPago) ───────────────────────────

export const crearCheckout = async (items, { datosEnvio, envio } = {}) => {
  const res = await fetch(`${API_URL}/api/orders/checkout`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify({ items, datosEnvio, envio }),
  });
  return res.json();
};

export const obtenerMisOrdenes = async () => {
  const res = await fetch(`${API_URL}/api/orders/mis-ordenes`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerOrden = async (id) => {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Ordenes (admin) ──────────────────────────────────

export const obtenerTodasOrdenes = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/orders/admin/todas?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const actualizarEstadoOrden = async (id, estado) => {
  const res = await fetch(`${API_URL}/api/orders/admin/${id}/estado`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify({ estado }),
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

// ─── Registrar visita a producto ──────────────────────
export const registrarVisita = async (productoId) => {
  try {
    await fetch(`${API_URL}/api/products/${productoId}/visita`, { method: 'POST' });
  } catch {
    // Silencioso — no bloquear la UX por un error de tracking
  }
};

// ─── Analytics (Admin) ────────────────────────────────

export const obtenerResumenAnalytics = async () => {
  const res = await fetch(`${API_URL}/api/analytics/resumen`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const obtenerProductosVendidos = async (periodo = 'todo') => {
  const res = await fetch(`${API_URL}/api/analytics/productos-vendidos?periodo=${periodo}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const obtenerProductosVisitados = async () => {
  const res = await fetch(`${API_URL}/api/analytics/productos-visitados`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const obtenerMenosVendidos = async () => {
  const res = await fetch(`${API_URL}/api/analytics/menos-vendidos`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const obtenerVentasPorDia = async (dias = 30) => {
  const res = await fetch(`${API_URL}/api/analytics/ventas-por-dia?dias=${dias}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const enviarInformeEmail = async () => {
  const res = await fetch(`${API_URL}/api/analytics/enviar-informe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

// ─── Gastos (Admin) ───────────────────────────────────

export const obtenerGastos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/gastos?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerResumenGastos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/gastos/resumen?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const crearGasto = async (gasto) => {
  const res = await fetch(`${API_URL}/api/gastos`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(gasto),
  });
  return res.json();
};

export const actualizarGasto = async (id, gasto) => {
  const res = await fetch(`${API_URL}/api/gastos/${id}`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify(gasto),
  });
  return res.json();
};

export const eliminarGasto = async (id) => {
  const res = await fetch(`${API_URL}/api/gastos/${id}`, {
    method: 'DELETE',
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Configuración (Admin) ────────────────────────────

export const obtenerConfiguracion = async () => {
  const res = await fetch(`${API_URL}/api/configuracion`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const actualizarConfiguracion = async (config) => {
  const res = await fetch(`${API_URL}/api/configuracion`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify(config),
  });
  return res.json();
};

// ─── Finanzas (Admin) ─────────────────────────────────

export const obtenerBalance = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/finanzas/balance?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerMargenes = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/finanzas/margenes?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerTendencia = async (meses = 6) => {
  const res = await fetch(`${API_URL}/api/finanzas/tendencia?meses=${meses}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerCanales = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/finanzas/canales?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Venta Manual (Admin) ─────────────────────────────

export const registrarVentaManual = async (venta) => {
  const res = await fetch(`${API_URL}/api/orders/manual`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(venta),
  });
  return res.json();
};

// ─── Campañas (Admin) ─────────────────────────────────

export const obtenerCampanas = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/campanas?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerCampana = async (id) => {
  const res = await fetch(`${API_URL}/api/campanas/${id}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const crearCampana = async (campana) => {
  const res = await fetch(`${API_URL}/api/campanas`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(campana),
  });
  return res.json();
};

export const actualizarCampana = async (id, campana) => {
  const res = await fetch(`${API_URL}/api/campanas/${id}`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify(campana),
  });
  return res.json();
};

export const eliminarCampana = async (id) => {
  const res = await fetch(`${API_URL}/api/campanas/${id}`, {
    method: 'DELETE',
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerResultadosCampana = async (id) => {
  const res = await fetch(`${API_URL}/api/campanas/${id}/resultados`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const compararCampanas = async (ids) => {
  const res = await fetch(`${API_URL}/api/campanas/accion/comparar?ids=${ids.join(',')}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

// ─── Dashboard Financiero (Admin) ────────────────────────

export const obtenerResumenDashboard = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/dashboard/resumen?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerDesgloseDashboard = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/dashboard/desglose?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerAlertasStock = async () => {
  const res = await fetch(`${API_URL}/api/dashboard/alertas-stock`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerLogistica = async () => {
  const res = await fetch(`${API_URL}/api/dashboard/logistica`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const actualizarDespacho = async (id, estadoDespacho) => {
  const res = await fetch(`${API_URL}/api/dashboard/logistica/${id}/despacho`, {
    method: 'PUT',
    headers: headersConAuth(),
    body: JSON.stringify({ estadoDespacho }),
  });
  return res.json();
};

export const marcarLogisticaPagada = async (id) => {
  const res = await fetch(`${API_URL}/api/dashboard/logistica/${id}/pagada`, {
    method: 'PUT',
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerTopProductos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/dashboard/top-productos?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const obtenerStockDashboard = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/api/dashboard/stock?${params}`, {
    headers: headersConAuth(),
  });
  return res.json();
};

export const registrarVentaManualDashboard = async (venta) => {
  const res = await fetch(`${API_URL}/api/dashboard/venta-manual`, {
    method: 'POST',
    headers: headersConAuth(),
    body: JSON.stringify(venta),
  });
  return res.json();
};

export const obtenerVentasPeriodo = async (dias = 30) => {
  const res = await fetch(`${API_URL}/api/dashboard/ventas-periodo?dias=${dias}`, {
    headers: headersConAuth(),
  });
  return res.json();
};
