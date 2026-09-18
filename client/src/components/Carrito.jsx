import { useState, useEffect } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useNavigate } from 'react-router-dom';
import { crearCheckout, obtenerProvincias, cotizarEnvio } from '../services/api';
import './Carrito.css';

function Carrito() {
  const {
    items, abierto, setAbierto, quitarItem,
    actualizarCantidad, vaciarCarrito, totalItems, totalPrecio,
  } = useCarrito();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ── Paso: 'carrito' o 'envio' ──
  const [paso, setPaso] = useState('carrito');

  // ── Datos de envío ──
  const [datosEnvio, setDatosEnvio] = useState({
    nombre: '', telefono: '', direccion: '',
    ciudad: '', provincia: '', codigoPostal: '', notas: '',
  });

  // ── Provincias y cotización ──
  const [provincias, setProvincias] = useState([]);
  const [cargandoProvincias, setCargandoProvincias] = useState(false);
  const [opciones, setOpciones] = useState([]);
  const [cotizando, setCotizando] = useState(false);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);

  // Reset paso al cerrar
  useEffect(() => {
    if (!abierto) {
      setPaso('carrito');
      setOpciones([]);
      setEnvioSeleccionado(null);
      setError('');
    }
  }, [abierto]);

  // Cargar provincias al ir al paso de envío
  useEffect(() => {
    if (paso === 'envio' && provincias.length === 0) {
      setCargandoProvincias(true);
      obtenerProvincias()
        .then((res) => {
          if (res.exito) setProvincias(res.datos || []);
        })
        .catch(() => {})
        .finally(() => setCargandoProvincias(false));
    }
  }, [paso, provincias.length]);

  // Calcular peso estimado (0.5 kg por item como base)
  const pesoEstimado = items.reduce((sum, i) => sum + i.cantidad * 0.5, 0);

  const handleCotizar = async () => {
    if (!datosEnvio.provincia || !datosEnvio.codigoPostal) {
      setError('Completá provincia y código postal para cotizar.');
      return;
    }

    setCotizando(true);
    setError('');
    setOpciones([]);
    setEnvioSeleccionado(null);

    try {
      const res = await cotizarEnvio({
        provincia: datosEnvio.provincia,
        codigo_postal: datosEnvio.codigoPostal,
        peso: pesoEstimado,
      });

      if (res.exito && res.datos.length > 0) {
        setOpciones(res.datos);
      } else {
        setError('No encontramos opciones de envío para ese destino. Verificá los datos.');
      }
    } catch {
      setError('Error al cotizar envío. Intentá de nuevo.');
    } finally {
      setCotizando(false);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      setAbierto(false);
      navigate('/ingresar');
      return;
    }

    if (!envioSeleccionado) {
      setError('Seleccioná una opción de envío.');
      return;
    }

    if (!datosEnvio.nombre || !datosEnvio.direccion || !datosEnvio.codigoPostal) {
      setError('Completá los datos de envío obligatorios.');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const resultado = await crearCheckout(items, {
        datosEnvio,
        envio: {
          costo: envioSeleccionado.valor,
          servicio: envioSeleccionado.servicio,
          correo: envioSeleccionado.correo,
          modalidad: envioSeleccionado.modalidad,
          horasEntrega: envioSeleccionado.horasEntrega,
        },
      });

      if (resultado.exito) {
        const url = resultado.datos.initPoint || resultado.datos.sandboxInitPoint;
        window.location.href = url;
      } else {
        setError(resultado.mensaje || 'Error al procesar el pago');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const formatPrecio = (precio) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(precio);

  const handleInput = (campo, valor) => {
    setDatosEnvio((prev) => ({ ...prev, [campo]: valor }));
    // Limpiar cotización si cambian provincia o CP
    if (campo === 'provincia' || campo === 'codigoPostal') {
      setOpciones([]);
      setEnvioSeleccionado(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`carrito-backdrop ${abierto ? 'visible' : ''}`}
        onClick={() => setAbierto(false)}
      />

      {/* Drawer */}
      <aside className={`carrito-drawer ${abierto ? 'abierto' : ''}`}>
        <header className="carrito-header">
          <h2>
            {paso === 'carrito' ? (
              <>
                <span>🛒</span> Carrito
                {totalItems > 0 && <span className="carrito-badge">{totalItems}</span>}
              </>
            ) : (
              <>
                <button className="carrito-volver" onClick={() => setPaso('carrito')}>←</button>
                <span>📦</span> Envío
              </>
            )}
          </h2>
          <button className="carrito-cerrar" onClick={() => setAbierto(false)}>✕</button>
        </header>

        {items.length === 0 ? (
          <div className="carrito-vacio">
            <span className="carrito-vacio-icon">🧉</span>
            <p>Tu carrito está vacío</p>
            <button className="carrito-btn-explorar" onClick={() => setAbierto(false)}>
              Explorar productos
            </button>
          </div>
        ) : paso === 'carrito' ? (
          <>
            {/* ── Lista de items ── */}
            <div className="carrito-items">
              {items.map((item) => (
                <div key={item.productoId} className="carrito-item">
                  <div className="carrito-item-img">
                    {item.imagen ? (
                      <img src={item.imagen} alt={item.nombre} />
                    ) : (
                      <span className="carrito-item-placeholder">🧉</span>
                    )}
                  </div>
                  <div className="carrito-item-info">
                    <h4>{item.nombre}</h4>
                    <span className="carrito-item-precio">{formatPrecio(item.precio)}</span>
                    <div className="carrito-item-cantidad">
                      <button
                        onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                      >−</button>
                      <span>{item.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                        disabled={item.cantidad >= (item.stock || 99)}
                      >+</button>
                    </div>
                  </div>
                  <button className="carrito-item-quitar" onClick={() => quitarItem(item.productoId)}>
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <footer className="carrito-footer">
              <div className="carrito-total">
                <span>Subtotal</span>
                <span className="carrito-total-precio">{formatPrecio(totalPrecio)}</span>
              </div>
              <button className="carrito-btn-pagar" onClick={() => setPaso('envio')}>
                Continuar → Datos de envío
              </button>
              <button className="carrito-btn-vaciar" onClick={vaciarCarrito}>
                Vaciar carrito
              </button>
            </footer>
          </>
        ) : (
          <>
            {/* ── Paso 2: Datos de envío + cotización ── */}
            <div className="carrito-envio-form">
              <div className="envio-campo">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={datosEnvio.nombre}
                  onChange={(e) => handleInput('nombre', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="envio-campo">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={datosEnvio.telefono}
                  onChange={(e) => handleInput('telefono', e.target.value)}
                  placeholder="11 1234-5678"
                />
              </div>

              <div className="envio-campo">
                <label>Dirección *</label>
                <input
                  type="text"
                  value={datosEnvio.direccion}
                  onChange={(e) => handleInput('direccion', e.target.value)}
                  placeholder="Av. Corrientes 1234, Piso 2"
                />
              </div>

              <div className="envio-fila">
                <div className="envio-campo">
                  <label>Provincia *</label>
                  <select
                    value={datosEnvio.provincia}
                    onChange={(e) => handleInput('provincia', e.target.value)}
                    disabled={cargandoProvincias}
                  >
                    <option value="">
                      {cargandoProvincias ? 'Cargando...' : 'Seleccionar'}
                    </option>
                    {provincias.map((p) => (
                      <option key={p.id || p.iso_id || p.nombre} value={p.id || p.iso_id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="envio-campo">
                  <label>Código Postal *</label>
                  <input
                    type="text"
                    value={datosEnvio.codigoPostal}
                    onChange={(e) => handleInput('codigoPostal', e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="envio-campo">
                <label>Ciudad</label>
                <input
                  type="text"
                  value={datosEnvio.ciudad}
                  onChange={(e) => handleInput('ciudad', e.target.value)}
                  placeholder="Buenos Aires"
                />
              </div>

              <div className="envio-campo">
                <label>Notas (opcional)</label>
                <textarea
                  value={datosEnvio.notas}
                  onChange={(e) => handleInput('notas', e.target.value)}
                  placeholder="Timbre 3B, dejar en portería..."
                  rows={2}
                />
              </div>

              {/* Botón cotizar */}
              <button
                className="envio-btn-cotizar"
                onClick={handleCotizar}
                disabled={cotizando || !datosEnvio.provincia || !datosEnvio.codigoPostal}
              >
                {cotizando ? 'Cotizando...' : '📦 Calcular costo de envío'}
              </button>

              {/* Opciones de envío */}
              {opciones.length > 0 && (
                <div className="envio-opciones">
                  <h4>Opciones de envío</h4>
                  {opciones.map((op, i) => (
                    <label
                      key={i}
                      className={`envio-opcion ${envioSeleccionado === op ? 'seleccionada' : ''}`}
                    >
                      <input
                        type="radio"
                        name="envio"
                        checked={envioSeleccionado === op}
                        onChange={() => setEnvioSeleccionado(op)}
                      />
                      <div className="envio-opcion-info">
                        <span className="envio-opcion-nombre">
                          {op.correo && `${op.correo} — `}{op.servicio}
                        </span>
                        <span className="envio-opcion-tiempo">
                          {op.horasEntrega ? `${Math.ceil(op.horasEntrega / 24)} días hábiles` : ''}
                        </span>
                      </div>
                      <span className="envio-opcion-precio">{formatPrecio(op.valor)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <footer className="carrito-footer">
              {error && <p className="carrito-error">{error}</p>}

              <div className="carrito-total">
                <span>Productos</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>
              {envioSeleccionado && (
                <div className="carrito-total carrito-total-envio">
                  <span>Envío ({envioSeleccionado.servicio})</span>
                  <span>{formatPrecio(envioSeleccionado.valor)}</span>
                </div>
              )}
              <div className="carrito-total carrito-total-final">
                <span>Total</span>
                <span className="carrito-total-precio">
                  {formatPrecio(totalPrecio + (envioSeleccionado?.valor || 0))}
                </span>
              </div>

              <button
                className="carrito-btn-pagar"
                onClick={handleCheckout}
                disabled={procesando || !envioSeleccionado}
              >
                {procesando ? 'Procesando...' : 'Pagar con MercadoPago'}
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

export default Carrito;
