import { useState, useRef } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useNavigate } from 'react-router-dom';
import './TarjetaProducto.css';

function TarjetaProducto({ producto }) {
  const { _id, nombre, descripcion, precio, stock, imagenes, videos, categoria } = producto;
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { agregarItem } = useCarrito();
  const [agregado, setAgregado] = useState(false);

  const handleAgregar = (e) => {
    e.stopPropagation();
    if (stock <= 0) return;
    agregarItem(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1200);
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

  return (
    <article
      className={`tarjeta-producto ${hovering ? 'tarjeta-hover' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="tarjeta-imagen">
        {/* Imagen principal */}
        {imagenPrincipal ? (
          <img
            src={imagenPrincipal}
            alt={nombre}
            loading="lazy"
            className="tarjeta-img-principal"
          />
        ) : (
          <div className="imagen-placeholder">🧉</div>
        )}

        {/* Video que se muestra al hacer hover */}
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

        {/* Overlay con gradiente */}
        <div className="tarjeta-img-overlay" />

        {/* Badges */}
        <span className="tarjeta-categoria">{categoria}</span>
        {totalMedia > 1 && (
          <span className="tarjeta-count">
            {videos?.length > 0 ? '▶ ' : ''}
            +{totalMedia - 1}
          </span>
        )}

        {/* CTA de ver más */}
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
          disabled={stock <= 0}
        >
          {agregado ? '✓ Agregado' : '🛒 Agregar al carrito'}
        </button>
      </div>
    </article>
  );
}

export default TarjetaProducto;
