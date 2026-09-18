import { useState, useEffect, useRef } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerProductoPorId } from '../services/api';
import { flyToCart } from '../utils/flyToCart';
import './DetalleProducto.css';

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mediaActivo, setMediaActivo] = useState(0);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const overlayRef = useRef(null);
  const mainImgRef = useRef(null);
  const { agregarItem } = useCarrito();
  const [agregado, setAgregado] = useState(false);

  const handleAgregarCarrito = () => {
    if (!producto || producto.stock <= 0) return;

    // Fly-to-cart animation
    if (mainImgRef.current) {
      flyToCart(mainImgRef.current);
    }

    agregarItem(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1200);
  };

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    obtenerProductoPorId(id)
      .then(({ datos }) => setProducto(datos))
      .catch(() => setProducto(null))
      .finally(() => setCargando(false));
  }, [id]);

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (galeriaAbierta) {
          setGaleriaAbierta(false);
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [galeriaAbierta, navigate]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      navigate('/');
    }
  };

  if (cargando) {
    return (
      <div className="detalle-overlay" ref={overlayRef}>
        <div className="detalle-cargando">
          <div className="cargando-spinner" />
          <span>Cargando producto...</span>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="detalle-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="detalle-modal">
          <p className="detalle-error">No se encontró el producto.</p>
          <button className="detalle-btn-volver" onClick={() => navigate('/')}>
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const { nombre, descripcion, precio, stock, imagenes = [], videos = [], categoria } = producto;
  const precioFormateado = precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  // Combinar todas las media (imágenes + videos)
  const allMedia = [
    ...imagenes.map((img) => ({ tipo: 'imagen', url: img.url })),
    ...videos.map((vid) => ({ tipo: 'video', url: vid.url })),
  ];

  const mediaActual = allMedia[mediaActivo] || null;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola! Me interesa el producto: ${nombre} (${precioFormateado}). ¿Está disponible?`);
    window.open(`https://wa.me/5491100000000?text=${msg}`, '_blank');
  };

  return (
    <>
      {/* Modal de detalle */}
      <div className="detalle-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="detalle-modal">
          {/* Botón cerrar */}
          <button className="detalle-cerrar" onClick={() => navigate('/')} aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="detalle-layout">
            {/* Galería de imágenes/videos */}
            <div className="detalle-galeria">
              <div className="galeria-principal" onClick={() => allMedia.length > 0 && setGaleriaAbierta(true)}>
                {mediaActual ? (
                  mediaActual.tipo === 'imagen' ? (
                    <img ref={mainImgRef} src={mediaActual.url} alt={nombre} className="galeria-img-principal" />
                  ) : (
                    <video src={mediaActual.url} controls className="galeria-video-principal" playsInline />
                  )
                ) : (
                  <div className="galeria-placeholder">🧉</div>
                )}

                {allMedia.length > 1 && mediaActual?.tipo === 'imagen' && (
                  <div className="galeria-ampliar-hint">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                    <span>Ampliar</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allMedia.length > 1 && (
                <div className="galeria-thumbs">
                  {allMedia.map((media, i) => (
                    <button
                      key={i}
                      className={`galeria-thumb ${i === mediaActivo ? 'activo' : ''}`}
                      onClick={() => setMediaActivo(i)}
                    >
                      {media.tipo === 'imagen' ? (
                        <img src={media.url} alt={`${nombre} ${i + 1}`} />
                      ) : (
                        <div className="thumb-video">
                          <video src={media.url} preload="metadata" />
                          <span className="thumb-play">▶</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info del producto */}
            <div className="detalle-info">
              <span className="detalle-categoria">{categoria}</span>
              <h1 className="detalle-nombre">{nombre}</h1>
              <p className="detalle-precio">{precioFormateado}</p>

              <div className="detalle-disponibilidad">
                <span className={`detalle-stock ${stock > 0 ? 'disponible' : 'agotado'}`}>
                  {stock > 0 ? `${stock} disponibles` : 'Sin stock'}
                </span>
              </div>

              {descripcion && (
                <div className="detalle-descripcion">
                  <h3>Descripción</h3>
                  <p>{descripcion}</p>
                </div>
              )}

              <div className="detalle-features">
                <div className="detalle-feature">
                  <span className="feature-icono">🚚</span>
                  <div>
                    <strong>Envío a todo el país</strong>
                    <span>Consultá costo y tiempos</span>
                  </div>
                </div>
                <div className="detalle-feature">
                  <span className="feature-icono">✨</span>
                  <div>
                    <strong>Calidad premium</strong>
                    <span>Materiales seleccionados</span>
                  </div>
                </div>
              </div>

              <button
                className={`detalle-btn-carrito ${agregado ? 'agregado' : ''}`}
                onClick={handleAgregarCarrito}
                disabled={stock <= 0}
              >
                {agregado ? '✓ Agregado al carrito' : '🛒 Agregar al carrito'}
              </button>
              <button className="detalle-btn-whatsapp" onClick={handleWhatsApp}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.3 0-4.438-.762-6.154-2.048l-.43-.324-2.655.89.89-2.655-.324-.43A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Consultar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Galería fullscreen */}
      {galeriaAbierta && (
        <div className="galeria-fullscreen" onClick={() => setGaleriaAbierta(false)}>
          <button className="galeria-fs-cerrar" onClick={() => setGaleriaAbierta(false)} aria-label="Cerrar galería">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <button
            className="galeria-fs-nav prev"
            onClick={(e) => { e.stopPropagation(); setMediaActivo((p) => (p - 1 + allMedia.length) % allMedia.length); }}
            aria-label="Anterior"
          >
            ‹
          </button>

          <div className="galeria-fs-media" onClick={(e) => e.stopPropagation()}>
            {mediaActual?.tipo === 'imagen' ? (
              <img src={mediaActual.url} alt={nombre} />
            ) : (
              <video src={mediaActual?.url} controls autoPlay playsInline />
            )}
          </div>

          <button
            className="galeria-fs-nav next"
            onClick={(e) => { e.stopPropagation(); setMediaActivo((p) => (p + 1) % allMedia.length); }}
            aria-label="Siguiente"
          >
            ›
          </button>

          <div className="galeria-fs-counter">
            {mediaActivo + 1} / {allMedia.length}
          </div>
        </div>
      )}
    </>
  );
}

export default DetalleProducto;
