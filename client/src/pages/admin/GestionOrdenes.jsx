import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerTodasOrdenes, actualizarEstadoOrden } from '../../services/api';
import './GestionOrdenes.css';

const estadoConfig = {
  pendiente: { label: 'Pendiente', clase: 'go-estado-pendiente', icon: '🕐' },
  aprobado: { label: 'Aprobado', clase: 'go-estado-aprobado', icon: '✅' },
  enviado: { label: 'Enviado', clase: 'go-estado-enviado', icon: '📦' },
  entregado: { label: 'Entregado', clase: 'go-estado-entregado', icon: '🎉' },
  rechazado: { label: 'Rechazado', clase: 'go-estado-rechazado', icon: '❌' },
  cancelado: { label: 'Cancelado', clase: 'go-estado-cancelado', icon: '🚫' },
};

const ESTADOS = ['pendiente', 'aprobado', 'enviado', 'entregado', 'rechazado', 'cancelado'];

function GestionOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [expandida, setExpandida] = useState(null);
  const [actualizando, setActualizando] = useState(null);

  const cargarOrdenes = async () => {
    setCargando(true);
    try {
      const res = await obtenerTodasOrdenes({ estado: filtroEstado, page: pagina, limit: 15 });
      if (res.exito) {
        setOrdenes(res.datos);
        setTotalPaginas(res.paginas || 1);
      }
    } catch (err) {
      console.error('Error cargando ordenes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, [filtroEstado, pagina]);

  const handleCambiarEstado = async (ordenId, nuevoEstado) => {
    setActualizando(ordenId);
    try {
      const res = await actualizarEstadoOrden(ordenId, nuevoEstado);
      if (res.exito) {
        setOrdenes((prev) =>
          prev.map((o) => (o._id === ordenId ? { ...o, estado: nuevoEstado } : o))
        );
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    } finally {
      setActualizando(null);
    }
  };

  const formatPrecio = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const formatFecha = (f) =>
    new Date(f).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="go-page">
      <div className="go-container">
        <header className="go-header">
          <div className="go-header-izq">
            <Link to="/admin" className="go-volver">← Panel Admin</Link>
            <h1>Gestion de Ordenes</h1>
          </div>
        </header>

        {/* Filtros */}
        <div className="go-filtros">
          <button
            className={`go-filtro-chip ${filtroEstado === '' ? 'activo' : ''}`}
            onClick={() => { setFiltroEstado(''); setPagina(1); }}
          >
            Todas
          </button>
          {ESTADOS.map((est) => {
            const cfg = estadoConfig[est];
            return (
              <button
                key={est}
                className={`go-filtro-chip ${filtroEstado === est ? 'activo' : ''}`}
                onClick={() => { setFiltroEstado(est); setPagina(1); }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="go-cargando">
            <div className="cargando-spinner" />
            Cargando ordenes...
          </div>
        ) : ordenes.length === 0 ? (
          <div className="go-vacio">
            <p>No hay ordenes {filtroEstado && `con estado "${filtroEstado}"`}</p>
          </div>
        ) : (
          <>
            <div className="go-lista">
              {ordenes.map((orden) => {
                const est = estadoConfig[orden.estado] || estadoConfig.pendiente;
                const isOpen = expandida === orden._id;
                const usuario = orden.usuario;

                return (
                  <div key={orden._id} className={`go-card ${isOpen ? 'expandida' : ''}`}>
                    <button
                      className="go-card-header"
                      onClick={() => setExpandida(isOpen ? null : orden._id)}
                    >
                      <div className="go-card-col1">
                        <span className="go-orden-id">
                          #{orden._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="go-orden-fecha">{formatFecha(orden.createdAt)}</span>
                      </div>
                      <div className="go-card-col2">
                        {usuario && (
                          <span className="go-cliente">
                            {usuario.nombre || usuario.email || 'Cliente'}
                          </span>
                        )}
                      </div>
                      <div className="go-card-col3">
                        <span className={`go-estado-badge ${est.clase}`}>
                          {est.icon} {est.label}
                        </span>
                        <span className="go-orden-total">{formatPrecio(orden.total)}</span>
                        <svg
                          className={`go-chevron ${isOpen ? 'abierto' : ''}`}
                          width="20" height="20" viewBox="0 0 20 20" fill="none"
                        >
                          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="go-detalle">
                        {/* Cliente info */}
                        {usuario && (
                          <div className="go-cliente-info">
                            <h4>Cliente</h4>
                            <p>{usuario.nombre}</p>
                            <p>{usuario.email}</p>
                            {usuario.telefono && <p>Tel: {usuario.telefono}</p>}
                          </div>
                        )}

                        {/* Items */}
                        <div className="go-items">
                          <h4>Productos</h4>
                          {orden.items.map((item, i) => (
                            <div key={i} className="go-item">
                              <div className="go-item-thumb">
                                {item.imagen ? (
                                  <img src={item.imagen} alt={item.nombre} />
                                ) : (
                                  <span>🧉</span>
                                )}
                              </div>
                              <div className="go-item-info">
                                <span className="go-item-nombre">{item.nombre}</span>
                                <span className="go-item-meta">
                                  {item.cantidad} x {formatPrecio(item.precio)}
                                </span>
                              </div>
                              <span className="go-item-subtotal">
                                {formatPrecio(item.precio * item.cantidad)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {orden.costoEnvio > 0 && (
                          <div className="go-linea-envio">
                            <span>Envio</span>
                            <span>{formatPrecio(orden.costoEnvio)}</span>
                          </div>
                        )}

                        <div className="go-linea-total">
                          <span>Total</span>
                          <span>{formatPrecio(orden.total)}</span>
                        </div>

                        {/* Datos envio */}
                        {orden.datosEnvio?.direccion && (
                          <div className="go-envio-datos">
                            <h4>Direccion de envio</h4>
                            <p>{orden.datosEnvio.nombre}</p>
                            <p>{orden.datosEnvio.direccion}, {orden.datosEnvio.ciudad}</p>
                            <p>{orden.datosEnvio.provincia} — CP {orden.datosEnvio.codigoPostal}</p>
                            {orden.datosEnvio.telefono && <p>Tel: {orden.datosEnvio.telefono}</p>}
                          </div>
                        )}

                        {orden.envio?.servicio && (
                          <div className="go-envio-servicio">
                            <span>{orden.envio.correo} — {orden.envio.modalidad}</span>
                          </div>
                        )}

                        {/* MP info */}
                        {orden.mpPaymentId && (
                          <div className="go-mp-info">
                            <h4>MercadoPago</h4>
                            <p>Payment ID: {orden.mpPaymentId}</p>
                            <p>Status: {orden.mpStatus} {orden.mpStatusDetail && `(${orden.mpStatusDetail})`}</p>
                          </div>
                        )}

                        {/* Cambiar estado */}
                        <div className="go-cambiar-estado">
                          <h4>Cambiar estado</h4>
                          <div className="go-estado-btns">
                            {ESTADOS.map((e) => {
                              const cfg = estadoConfig[e];
                              const isCurrent = orden.estado === e;
                              return (
                                <button
                                  key={e}
                                  className={`go-estado-btn ${isCurrent ? 'current' : ''}`}
                                  disabled={isCurrent || actualizando === orden._id}
                                  onClick={() => handleCambiarEstado(orden._id, e)}
                                >
                                  {actualizando === orden._id ? '...' : `${cfg.icon} ${cfg.label}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Paginacion */}
            {totalPaginas > 1 && (
              <div className="go-paginacion">
                <button
                  className="go-pag-btn"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span className="go-pag-info">
                  Pagina {pagina} de {totalPaginas}
                </span>
                <button
                  className="go-pag-btn"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GestionOrdenes;
