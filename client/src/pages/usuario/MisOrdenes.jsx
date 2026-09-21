import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerMisOrdenes, eliminarOrdenPendiente } from '../../services/api';
import './MisOrdenes.css';

const estadoConfig = {
  pendiente: { label: 'Pendiente', clase: 'estado-pendiente', icon: '🕐' },
  aprobado: { label: 'Aprobado', clase: 'estado-aprobado', icon: '✅' },
  enviado: { label: 'Enviado', clase: 'estado-enviado', icon: '📦' },
  entregado: { label: 'Entregado', clase: 'estado-entregado', icon: '🎉' },
  rechazado: { label: 'Rechazado', clase: 'estado-rechazado', icon: '❌' },
  cancelado: { label: 'Cancelado', clase: 'estado-cancelado', icon: '🚫' },
};

function MisOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandida, setExpandida] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    obtenerMisOrdenes()
      .then((r) => {
        if (r.exito) setOrdenes(r.datos);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

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

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que queres eliminar esta orden pendiente?')) return;
    setEliminando(id);
    try {
      const res = await eliminarOrdenPendiente(id);
      if (res.exito) {
        setOrdenes((prev) => prev.filter((o) => o._id !== id));
      } else {
        alert(res.mensaje || 'No se pudo eliminar la orden.');
      }
    } catch {
      alert('Error al eliminar la orden.');
    } finally {
      setEliminando(null);
    }
  };

  if (cargando) {
    return (
      <div className="mis-ordenes-page">
        <div className="mis-ordenes-cargando">
          <div className="cargando-spinner" />
          Cargando tus ordenes...
        </div>
      </div>
    );
  }

  return (
    <div className="mis-ordenes-page">
      <div className="mis-ordenes-container">
        <header className="mis-ordenes-header">
          <Link to="/" className="mis-ordenes-volver">← Volver</Link>
          <h1>Mis Ordenes</h1>
          <p className="mis-ordenes-sub">
            {ordenes.length === 0 ? 'Todavia no hiciste ninguna compra' : `${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''}`}
          </p>
        </header>

        {ordenes.length === 0 ? (
          <div className="mis-ordenes-vacio">
            <span className="vacio-icon">🧉</span>
            <p>No tenes ordenes todavia</p>
            <Link to="/" className="vacio-btn">Ver productos</Link>
          </div>
        ) : (
          <div className="mis-ordenes-lista">
            {ordenes.map((orden) => {
              const est = estadoConfig[orden.estado] || estadoConfig.pendiente;
              const isOpen = expandida === orden._id;

              return (
                <div key={orden._id} className={`orden-card ${isOpen ? 'expandida' : ''}`}>
                  <button
                    className="orden-card-header"
                    onClick={() => setExpandida(isOpen ? null : orden._id)}
                  >
                    <div className="orden-header-izq">
                      <span className="orden-id">
                        #{orden._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="orden-fecha">{formatFecha(orden.createdAt)}</span>
                    </div>
                    <div className="orden-header-der">
                      <span className={`orden-estado ${est.clase}`}>
                        {est.icon} {est.label}
                      </span>
                      <span className="orden-total">{formatPrecio(orden.total)}</span>
                      <svg
                        className={`orden-chevron ${isOpen ? 'abierto' : ''}`}
                        width="20" height="20" viewBox="0 0 20 20" fill="none"
                      >
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="orden-detalle">
                      <div className="orden-items">
                        {orden.items.map((item, i) => (
                          <div key={i} className="orden-item">
                            <div className="orden-item-thumb">
                              {item.imagen ? (
                                <img src={item.imagen} alt={item.nombre} />
                              ) : (
                                <span>🧉</span>
                              )}
                            </div>
                            <div className="orden-item-info">
                              <span className="orden-item-nombre">{item.nombre}</span>
                              <span className="orden-item-meta">
                                {item.cantidad} x {formatPrecio(item.precio)}
                              </span>
                            </div>
                            <span className="orden-item-subtotal">
                              {formatPrecio(item.precio * item.cantidad)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {orden.costoEnvio > 0 && (
                        <div className="orden-envio-costo">
                          <span>Envio</span>
                          <span>{formatPrecio(orden.costoEnvio)}</span>
                        </div>
                      )}

                      <div className="orden-total-linea">
                        <span>Total</span>
                        <span>{formatPrecio(orden.total)}</span>
                      </div>

                      {orden.datosEnvio?.direccion && (
                        <div className="orden-envio-datos">
                          <h4>Datos de envio</h4>
                          <p>{orden.datosEnvio.nombre}</p>
                          <p>{orden.datosEnvio.direccion}, {orden.datosEnvio.ciudad}</p>
                          <p>{orden.datosEnvio.provincia} — CP {orden.datosEnvio.codigoPostal}</p>
                          {orden.datosEnvio.telefono && <p>Tel: {orden.datosEnvio.telefono}</p>}
                        </div>
                      )}

                      {orden.envio?.servicio && (
                        <div className="orden-envio-servicio">
                          <span>{orden.envio.correo} — {orden.envio.modalidad}</span>
                          {orden.envio.horasEntrega > 0 && (
                            <span className="orden-envio-tiempo">
                              ~{Math.ceil(orden.envio.horasEntrega / 24)} dias habiles
                            </span>
                          )}
                        </div>
                      )}

                      {/* Botón eliminar para ordenes pendientes */}
                      {orden.estado === 'pendiente' && (
                        <div className="orden-acciones">
                          <button
                            className="orden-btn-eliminar"
                            onClick={() => handleEliminar(orden._id)}
                            disabled={eliminando === orden._id}
                          >
                            {eliminando === orden._id ? 'Eliminando...' : '🗑 Eliminar orden pendiente'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MisOrdenes;
