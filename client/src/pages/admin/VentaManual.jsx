import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { obtenerTodosProductos, registrarVentaManual } from '../../services/api';
import './VentaManual.css';

function VentaManual() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [items, setItems] = useState([]);
  const [canal, setCanal] = useState('presencial');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [exito, setExito] = useState(false);
  const buscadorRef = useRef(null);

  useEffect(() => {
    obtenerTodosProductos({ limite: 500 }).then((res) => {
      if (res.exito) setProductos(res.datos || []);
    });
  }, []);

  useEffect(() => {
    if (busqueda.length < 2) {
      setSugerencias([]);
      return;
    }
    const term = busqueda.toLowerCase();
    const filtrados = productos.filter((p) =>
      p.activo && p.nombre.toLowerCase().includes(term)
    ).slice(0, 8);
    setSugerencias(filtrados);
  }, [busqueda, productos]);

  const agregarItem = (producto) => {
    const existe = items.find((i) => i.productoId === producto._id);
    if (existe) {
      if (existe.cantidad < producto.stock) {
        setItems(items.map((i) =>
          i.productoId === producto._id ? { ...i, cantidad: i.cantidad + 1 } : i
        ));
      }
    } else {
      setItems([...items, {
        productoId: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        costoUnitario: producto.costoUnitario || 0,
        cantidad: 1,
        stock: producto.stock,
        imagen: producto.imagenes?.[0]?.url || '',
      }]);
    }
    setBusqueda('');
    setSugerencias([]);
  };

  const cambiarCantidad = (productoId, delta) => {
    setItems(items.map((i) => {
      if (i.productoId !== productoId) return i;
      const nueva = i.cantidad + delta;
      if (nueva < 1 || nueva > i.stock) return i;
      return { ...i, cantidad: nueva };
    }));
  };

  const quitarItem = (productoId) => {
    setItems(items.filter((i) => i.productoId !== productoId));
  };

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const costoTotal = items.reduce((sum, i) => sum + i.costoUnitario * i.cantidad, 0);
  const margen = total > 0 ? ((total - costoTotal) / total * 100) : 0;

  const formatMoney = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const handleRegistrar = async () => {
    if (items.length === 0) return;
    setRegistrando(true);
    try {
      const res = await registrarVentaManual({
        items: items.map((i) => ({ productoId: i.productoId, nombre: i.nombre, cantidad: i.cantidad })),
        canal,
        metodoPago,
        notasVenta: notas,
      });
      if (res.exito) {
        setExito(true);
        setItems([]);
        setNotas('');
      }
    } catch (err) {
      console.error('Error registrando venta:', err);
    } finally {
      setRegistrando(false);
    }
  };

  if (exito) {
    return (
      <div className="venta-manual-page">
        <div className="venta-exito">
          <h2>Venta registrada con exito</h2>
          <p>El stock fue actualizado automaticamente.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="venta-btn-registrar" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={() => setExito(false)}>
              Registrar otra venta
            </button>
            <Link to="/admin" className="venta-btn-volver">Volver al panel</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="venta-manual-page">
      <div className="venta-header">
        <h1>Venta Manual</h1>
        <Link to="/admin" className="venta-btn-volver">← Panel</Link>
      </div>

      {/* Buscador */}
      <div className="venta-buscador" ref={buscadorRef}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto por nombre..."
        />
        {sugerencias.length > 0 && (
          <div className="venta-sugerencias">
            {sugerencias.map((p) => (
              <div key={p._id} className="venta-sugerencia-item" onClick={() => agregarItem(p)}>
                {p.imagenes?.[0]?.url && <img src={p.imagenes[0].url} alt="" className="venta-sug-img" />}
                <div className="venta-sug-info">
                  <div className="venta-sug-nombre">{p.nombre}</div>
                  <div className="venta-sug-detalle">{formatMoney(p.precio)} · Stock: {p.stock}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="venta-items-vacio">
          <p>Busca y agrega productos para registrar la venta</p>
        </div>
      ) : (
        <div className="venta-items">
          {items.map((item) => (
            <div key={item.productoId} className="venta-item">
              {item.imagen && <img src={item.imagen} alt="" className="venta-item-img" />}
              <div className="venta-item-info">
                <div className="venta-item-nombre">{item.nombre}</div>
                <div className="venta-item-precio">{formatMoney(item.precio)} c/u</div>
              </div>
              <div className="venta-item-cant">
                <button onClick={() => cambiarCantidad(item.productoId, -1)}>−</button>
                <span>{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item.productoId, 1)}>+</button>
              </div>
              <div className="venta-item-subtotal">{formatMoney(item.precio * item.cantidad)}</div>
              <button className="venta-item-quitar" onClick={() => quitarItem(item.productoId)}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Opciones y total */}
      {items.length > 0 && (
        <div className="venta-opciones">
          <div className="venta-form-grupo">
            <label>Canal de venta</label>
            <select value={canal} onChange={(e) => setCanal(e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="venta-form-grupo">
            <label>Metodo de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="venta-form-grupo">
            <label>Notas de venta</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas opcionales..."
              rows={2}
            />
          </div>

          <div className="venta-totales">
            <div>
              <div className="venta-total-label">Total</div>
              {costoTotal > 0 && (
                <div className="venta-margen-info">Margen estimado: {margen.toFixed(1)}%</div>
              )}
            </div>
            <div className="venta-total-monto">{formatMoney(total)}</div>
          </div>

          <button
            className="venta-btn-registrar"
            onClick={handleRegistrar}
            disabled={registrando || items.length === 0}
          >
            {registrando ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      )}
    </div>
  );
}

export default VentaManual;
