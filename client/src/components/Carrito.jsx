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

  // ── Modo de entrega: 'envio' o 'coordinar' ──
  const [modoEntrega, setModoEntrega] = useState('envio');

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
      setModoEntrega('envio');
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

  // Auto-completar datos del usuario logueado
  useEffect(() => {
    if (paso === 'envio') {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          setDatosEnvio((prev) => ({
            ...prev,
            nombre: prev.nombre || user.nombre || '',
            telefono: prev.telefono || user.telefono || '',
          }));
        }
      } catch {}
    }
  }, [paso]);

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

    // Validaciones según modo de entrega
    if (modoEntrega === 'envio') {
      if (!envioSeleccionado) {
        setError('Seleccioná una opción de envío.');
        return;
      }
      if (!datosEnvio.nombre || !datosEnvio.direccion || !datosEnvio.codigoPostal) {
        setError('Completá los datos de envío obligatorios.');
        return;
      }
    } else {
      // Coordinar entrega: solo nombre y teléfono obligatorios
      if (!datosEnvio.nombre || !datosEnvio.telefono) {
        setError('Completá tu nombre y teléfono para coordinar la entrega.');
        return;
      }
    }

    setProcesando(true);
    setError('');

    try {
      const envioData = modoEntrega === 'coordinar'
        ? {
            costo: 0,
            servicio: 'Coordinar con vendedor',
            correo: '',
            modalidad: 'coordinar',
            horasEntrega: 0,
          }
        : {
            costo: envioSeleccionado.valor,
            servicio: envioSeleccionado.servicio,
            correo: envioSeleccionado.correo,
            modalidad: envioSeleccionado.modalidad,
            horasEntrega: envioSeleccionado.horasEntrega,
          };

      const resultado = await crearCheckout(items, {
        datosEnvio,
        envio: envioData,
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

  const handleCambiarModo = (modo) => {
    setModoEntrega(modo);
    setEnvioSeleccionado(null);
    setOpciones([]);
    setError('');
  };

  // Costo de envío actual
  const costoEnvio = modoEntrega === 'coordinar' ? 0 : (envioSeleccionado?.valor || 0);
  const puedeCheckout = modoEntrega === 'coordinar' || envioSeleccionado;

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
            {/* ── Paso 2: Modo de entrega + datos ── */}
            <div className="carrito-envio-form">

              {/* ── Selector de modo de entrega ── */}
              <div className="entrega-modo-selector">
                <label
                  className={`entrega-modo-opcion ${modoEntrega === 'envio' ? 'activo' : ''}`}
                >
                  <input
                    type="radio"
                    name="modoEntrega"
                    checked={modoEntrega === 'envio'}
                    onChange={() => handleCambiarModo('envio')}
                  />
                  <span className="entrega-modo-icon">🚚</span>
                  <span className="entrega-modo-texto">Envío a domicilio</span>
                </label>
                <label
                  className={`entrega-modo-opcion ${modoEntrega === 'coordinar' ? 'activo' : ''}`}
                >
                  <input
                    type="radio"
                    name="modoEntrega"
                    checked={modoEntrega === 'coordinar'}
                    onChange={() => handleCambiarModo('coordinar')}
                  />
                  <span className="entrega-modo-icon">🤝</span>
                  <span className="entrega-modo-texto">Coordinar entrega</span>
                </label>
              </div>

              {modoEntrega === 'coordinar' && (
                <div className="entrega-coordinar-info">
                  <p>Nos pondremos en contacto por WhatsApp para coordinar el punto de encuentro y horario de entrega.</p>
                </div>
              )}

              {/* ── Campos comunes ── */}
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
                <label>Teléfono {modoEntrega === 'coordinar' ? '*' : ''}</label>
                <input
                  type="tel"
                  value={datosEnvio.telefono}
                  onChange={(e) => handleInput('telefono', e.target.value)}
                  placeholder="11 1234-5678"
                />
              </div>

              {/* ── Campos solo para envío a domicilio ── */}
              {modoEntrega === 'envio' && (
                <>
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
                </>
              )}

              {/* Notas para coordinar */}
              {modoEntrega === 'coordinar' && (
                <div className="envio-campo">
                  <label>Notas (opcional)</label>
                  <textarea
                    value={datosEnvio.notas}
                    onChange={(e) => handleInput('notas', e.target.value)}
                    placeholder="Zona preferida, horario disponible..."
                    rows={2}
                  />
                </div>
              )}
            </div>

            <footer className="carrito-footer">
              {error && <p className="carrito-error">{error}</p>}

              <div className="carrito-total">
                <span>Productos</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>
              {costoEnvio > 0 && (
                <div className="carrito-total carrito-total-envio">
                  <span>Envío ({envioSeleccionado.servicio})</span>
                  <span>{formatPrecio(costoEnvio)}</span>
                </div>
              )}
              {modoEntrega === 'coordinar' && (
                <div className="carrito-total carrito-total-envio">
                  <span>Envío</span>
                  <span className="envio-gratis">A coordinar</span>
                </div>
              )}
              <div className="carrito-total carrito-total-final">
                <span>Total</span>
                <span className="carrito-total-precio">
                  {formatPrecio(totalPrecio + costoEnvio)}
                </span>
              </div>

              <button
                className="carrito-btn-pagar"
                onClick={handleCheckout}
                disabled={procesando || !puedeCheckout}
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
