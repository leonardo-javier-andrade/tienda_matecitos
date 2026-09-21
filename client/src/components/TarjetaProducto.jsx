import { useState, useRef } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useNavigate } from 'react-router-dom';
import { flyToCart, flyToCartPlaceholder } from '../utils/flyToCart';
import { toggleFavorito } from '../services/api';
import './TarjetaProducto.css';

function TarjetaProducto({ producto, esFavorito, onToggleFav }) {
  const { _id, nombre, descripcion, precio, stock, imagenes, videos, categoria } = producto;
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const navigate = useNavigate();
  const { agregarItem } = useCarrito();
  const [agregado, setAgregado] = useState(false);
  const [favLocal, setFavLocal] = useState(esFavorito || false);
  const [favAnimando, setFavAnimando] = useState(false);

  const handleAgregar = (e) => {
    e.stopPropagation();
    if (stock <= 0) return;

    const imgEl = imgRef.current;
    if (imgEl) {
      flyToCart(imgEl);
    } else {
      const placeholder = e.currentTarget.closest('.tarjeta-producto')?.querySelector('.imagen-placeholder');
      if (placeholder) flyToCartPlaceholder(placeholder);
    }

    agregarItem(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1200);
  };

  const handleFavorito = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/ingresar');
      return;
    }
    setFavAnimando(true);
    try {
      const res = await toggleFavorito(_id);
      if (res.exito) {
        setFavLocal(res.agregado);
        if (onToggleFav) onToggleFav(_id, res.agregado);
      }
    } catch {}
    setTimeout(() => setFavAnimando(false), 400);
  };

  const precioFormateado = precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  const imagenPrincipal = imagenes && imagenes.length > 0 ? imagenes[0].url : null;
  const videoPrincipal = videos && videos.length > 0 ? videos[0].url : null;
  const totalMedia = (imagenes?.length || 0) + (videos?.length || 0);

  const handleMouseEnter = () => {
    setHovering(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = () => {
    navigate(`/producto/${_id}`);
  };

  const sinStock = stock <= 0;

  return (
    <article
      className={`tarjeta-producto ${hovering ? 'tarjeta-hover' : ''} ${sinStock ? 'tarjeta-sin-stock' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="tarjeta-imagen">
        {imagenPrincipal ? (
          <img
            ref={imgRef}
            src={imagenPrincipal}
            alt={nombre}
            loading="lazy"
            className="tarjeta-img-principal"
          />
        ) : (
          <div className="imagen-placeholder">🧉</div>
        )}

        {videoPrincipal && (
          <video
            ref={videoRef}
            src={videoPrincipal}
            className={`tarjeta-video-hover ${hovering ? 'visible' : ''}`}
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}

        <div className="tarjeta-img-overlay" />

        <span className="tarjeta-categoria">{categoria}</span>
        {totalMedia > 1 && (
          <span className="tarjeta-count">
            {videos?.length > 0 ? '▶ ' : ''}
            +{totalMedia - 1}
          </span>
        )}

        {/* Botón Favorito */}
        <button
          className={`tarjeta-fav-btn ${favLocal ? 'activo' : ''} ${favAnimando ? 'animando' : ''}`}
          onClick={handleFavorito}
          title={favLocal ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <svg className="tarjeta-fav-icon" viewBox="0 0 32 32" width="28" height="28">
            {/* Heart shape */}
            <path
              className="fav-corazon"
              d="M16 28S3 20.5 3 12a6.5 6.5 0 0 1 13-1 6.5 6.5 0 0 1 13 1c0 8.5-13 16-13 16z"
              fill={favLocal ? '#e74c3c' : 'none'}
              stroke={favLocal ? '#e74c3c' : '#fff'}
              strokeWidth="1.5"
            />
            {/* Mate icon inside the heart */}
            <g className="fav-mate" transform="translate(11, 11) scale(0.42)">
              <ellipse cx="12" cy="7" rx="7" ry="4" fill="none" stroke={favLocal ? '#fff' : '#fff'} strokeWidth="2" />
              <path d="M5 7 C5 7, 4 20, 12 20 C20 20, 19 7, 19 7" fill="none" stroke={favLocal ? '#fff' : '#fff'} strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="3" x2="12" y2="1" stroke={favLocal ? '#fff' : '#fff'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="4" x2="15" y2="2" stroke={favLocal ? '#fff' : '#fff'} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        </button>

        {sinStock && (
          <div className="tarjeta-sin-stock-overlay">
            <span>Sin stock</span>
          </div>
        )}

        <div className={`tarjeta-ver-mas ${hovering ? 'visible' : ''}`}>
          <span>Ver producto</span>
        </div>
      </div>

      <div className="tarjeta-contenido">
        <h3 className="tarjeta-nombre">{nombre}</h3>
        {descripcion && <p className="tarjeta-descripcion">{descripcion}</p>}
        <div className="tarjeta-footer">
          <span className="tarjeta-precio">{precioFormateado}</span>
          <span className={`tarjeta-stock ${stock > 0 ? 'disponible' : 'agotado'}`}>
            {stock > 0 ? 'Disponible' : 'Sin stock'}
          </span>
        </div>
        <button
          className={`tarjeta-agregar-carrito ${agregado ? 'agregado' : ''}`}
          onClick={handleAgregar}
          disabled={sinStock}
        >
          {agregado ? '✓ Agregado' : '🛒 Agregar al carrito'}
        </button>
      </div>
    </article>
  );
}

export default TarjetaProducto;
