import './TarjetaProducto.css';

function TarjetaProducto({ producto }) {
  const { nombre, descripcion, precio, stock, imagenUrl, categoria } = producto;

  const precioFormateado = precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  return (
    <article className="tarjeta-producto">
      <div className="tarjeta-imagen">
        {imagenUrl ? (
          <img src={imagenUrl} alt={nombre} loading="lazy" />
        ) : (
          <div className="imagen-placeholder">🧉</div>
        )}
        <span className="tarjeta-categoria">{categoria}</span>
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
