import './TarjetaProducto.css';

function TarjetaProducto({ producto }) {
  const { nombre, descripcion, precio, stock, imagenes, categoria } = producto;

  const precioFormateado = precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  const imagenPrincipal = imagenes && imagenes.length > 0 ? imagenes[0].url : null;

  return (
    <article className="tarjeta-producto">
      <div className="tarjeta-imagen">
        {imagenPrincipal ? (
          <img src={imagenPrincipal} alt={nombre} loading="lazy" />
        ) : (
          <div className="imagen-placeholder">🧉</div>
        )}
        <span className="tarjeta-categoria">{categoria}</span>
        {imagenes && imagenes.length > 1 && (
          <span className="tarjeta-count">+{imagenes.length - 1}</span>
        )}
      </div>

      <div className="tarjeta-contenido">
        <h3 className="tarjeta-nombre">{nombre}</h3>
        {descripcion && <p className="tarjeta-descripcion">{descripcion}</p>}
        <div className="tarjeta-footer">
          <span className="tarjeta-precio">{precioFormateado}</span>
          <span className={`tarjeta-stock ${stock > 0 ? 'disponible' : 'agotado'}`}>
            {stock > 0 ? `${stock} disponibles` : 'Sin stock'}
          </span>
        </div>
      </div>
    </article>
  );
}

export default TarjetaProducto;
