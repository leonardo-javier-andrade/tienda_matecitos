import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { obtenerTodasOrdenes } from '../../services/api';
import './Documentos.css';

const LOGO_BASE64 = 'data:image/png;base64,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';

const HISTORIAL_KEY = 'matecitos_documentos_historial';

const hoy = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const formatMoneda = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

const formatFecha = (f) => {
  if (!f) return '—';
  const partes = f.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return f;
};

const itemVacio = () => ({ descripcion: '', cantidad: 1, precioUnitario: 0 });

const datosIniciales = (tipo = 'factura') => ({
  emisorNombre: 'Matecitos',
  emisorDireccion: '',
  emisorTelefono: '',
  emisorEmail: '',
  emisorCuit: '',
  clienteNombre: '',
  clienteDireccion: '',
  clienteTelefono: '',
  clienteEmail: '',
  clienteCuit: '',
  tipo,
  numero: '0001-00000001',
  fecha: hoy(),
  condicionVenta: 'Contado',
  notas: '',
  items: [itemVacio()],
});

const cargarHistorial = () => {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const guardarHistorialLS = (historial) => {
  try {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  } catch {
    // localStorage full or unavailable
  }
};

export default function Documentos() {
  const [vista, setVista] = useState('dashboard'); // 'dashboard' | 'factura' | 'remito'
  const [datos, setDatos] = useState(datosIniciales('factura'));
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState('');
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [historial, setHistorial] = useState(cargarHistorial);

  useEffect(() => {
    setCargandoOrdenes(true);
    obtenerTodasOrdenes({ limite: 50 })
      .then((res) => {
        if (res.exito) setOrdenes(res.datos || []);
      })
      .catch(() => {})
      .finally(() => setCargandoOrdenes(false));
  }, []);

  const cambiarCampo = (campo, valor) => setDatos((prev) => ({ ...prev, [campo]: valor }));

  const cambiarItem = (idx, campo, valor) => {
    setDatos((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [campo]: valor };
      return { ...prev, items };
    });
  };

  const agregarItem = () => setDatos((prev) => ({ ...prev, items: [...prev.items, itemVacio()] }));
  const quitarItem = (idx) =>
    setDatos((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== idx) : prev.items,
    }));

  const subtotalItem = (item) => (item.cantidad || 0) * (item.precioUnitario || 0);
  const totalItems = datos.items.reduce((sum, it) => sum + subtotalItem(it), 0);

  const cargarDesdeOrden = () => {
    if (!ordenSeleccionada) return;
    const orden = ordenes.find((o) => o._id === ordenSeleccionada);
    if (!orden) return;

    const items = (orden.items || []).map((it) => ({
      descripcion: it.producto?.nombre || it.titulo || 'Producto',
      cantidad: it.cantidad || 1,
      precioUnitario: it.precioUnitario || it.precio || 0,
    }));

    setDatos((prev) => ({
      ...prev,
      clienteNombre: orden.comprador?.nombre || orden.nombreComprador || '',
      clienteEmail: orden.comprador?.email || orden.emailComprador || '',
      clienteTelefono: orden.comprador?.telefono || '',
      clienteDireccion: orden.envio
        ? `${orden.envio.calle || ''} ${orden.envio.numero || ''}, ${orden.envio.localidad || ''}, ${orden.envio.provincia || ''}`
        : '',
      items: items.length > 0 ? items : [itemVacio()],
      notas: orden.notasVenta || prev.notas,
    }));
  };

  const imprimir = () => window.print();

  const guardarDocumento = useCallback(() => {
    const totalFinal = datos.tipo === 'factura' ? totalItems * 1.21 : totalItems;
    const doc = {
      id: Date.now(),
      tipo: datos.tipo,
      numero: datos.numero,
      fecha: datos.fecha,
      clienteNombre: datos.clienteNombre,
      total: totalFinal,
      items: datos.items,
      condicionVenta: datos.condicionVenta,
      notas: datos.notas,
      emisorNombre: datos.emisorNombre,
      emisorCuit: datos.emisorCuit,
      emisorDireccion: datos.emisorDireccion,
      emisorTelefono: datos.emisorTelefono,
      emisorEmail: datos.emisorEmail,
      clienteCuit: datos.clienteCuit,
      clienteDireccion: datos.clienteDireccion,
      clienteTelefono: datos.clienteTelefono,
      clienteEmail: datos.clienteEmail,
    };
    const nuevo = [doc, ...historial];
    setHistorial(nuevo);
    guardarHistorialLS(nuevo);
    alert(`Documento guardado: ${datos.tipo === 'factura' ? 'Factura' : 'Remito'} N.${datos.numero}`);
  }, [datos, totalItems, historial]);

  const eliminarDocumento = (id) => {
    if (!window.confirm('Eliminar este documento del historial?')) return;
    const nuevo = historial.filter((d) => d.id !== id);
    setHistorial(nuevo);
    guardarHistorialLS(nuevo);
  };

  const verDocumento = (doc) => {
    setVista(doc.tipo);
    setDatos({
      emisorNombre: doc.emisorNombre || 'Matecitos',
      emisorDireccion: doc.emisorDireccion || '',
      emisorTelefono: doc.emisorTelefono || '',
      emisorEmail: doc.emisorEmail || '',
      emisorCuit: doc.emisorCuit || '',
      clienteNombre: doc.clienteNombre || '',
      clienteDireccion: doc.clienteDireccion || '',
      clienteTelefono: doc.clienteTelefono || '',
      clienteEmail: doc.clienteEmail || '',
      clienteCuit: doc.clienteCuit || '',
      tipo: doc.tipo,
      numero: doc.numero || '',
      fecha: doc.fecha || hoy(),
      condicionVenta: doc.condicionVenta || 'Contado',
      notas: doc.notas || '',
      items: doc.items && doc.items.length > 0 ? doc.items : [itemVacio()],
    });
  };

  const entrarVista = (tipo) => {
    setVista(tipo);
    setDatos(datosIniciales(tipo));
    setOrdenSeleccionada('');
  };

  const volverDashboard = () => {
    setVista('dashboard');
    setDatos(datosIniciales('factura'));
    setOrdenSeleccionada('');
  };

  const tituloDoc = datos.tipo === 'factura' ? 'FACTURA' : 'REMITO';
  const historialFiltrado = vista === 'dashboard'
    ? historial
    : historial.filter((d) => d.tipo === vista);

  // ============================================================
  //  DASHBOARD VIEW
  // ============================================================
  if (vista === 'dashboard') {
    return (
      <div className="documentos-page">
        <div className="doc-header">
          <h1>Documentos</h1>
          <Link to="/admin" className="doc-btn-volver">
            ← Volver al panel
          </Link>
        </div>

        {/* Big tiles */}
        <div className="doc-dashboard-tiles">
          <button className="doc-tile doc-tile-factura" onClick={() => entrarVista('factura')}>
            <div className="doc-tile-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="doc-tile-title">Facturas</span>
            <span className="doc-tile-desc">Crear y gestionar facturas de venta</span>
            <span className="doc-tile-count">
              {historial.filter((d) => d.tipo === 'factura').length} guardadas
            </span>
          </button>

          <button className="doc-tile doc-tile-remito" onClick={() => entrarVista('remito')}>
            <div className="doc-tile-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span className="doc-tile-title">Remitos</span>
            <span className="doc-tile-desc">Crear y gestionar remitos de entrega</span>
            <span className="doc-tile-count">
              {historial.filter((d) => d.tipo === 'remito').length} guardados
            </span>
          </button>
        </div>

        {/* Historial combinado */}
        <div className="doc-historial-section">
          <h2>Historial de documentos</h2>
          {historial.length === 0 ? (
            <p className="doc-historial-vacio">
              No hay documentos guardados todavia. Crea una factura o un remito para comenzar.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="doc-historial-tabla">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Numero</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className={`doc-badge doc-badge-${doc.tipo}`}>
                          {doc.tipo === 'factura' ? 'Factura' : 'Remito'}
                        </span>
                      </td>
                      <td className="doc-mono">{doc.numero}</td>
                      <td>{formatFecha(doc.fecha)}</td>
                      <td>{doc.clienteNombre || '—'}</td>
                      <td className="doc-mono">{formatMoneda(doc.total)}</td>
                      <td className="doc-acciones-cell">
                        <button className="doc-btn-ver" onClick={() => verDocumento(doc)} title="Ver / reimprimir">
                          Ver
                        </button>
                        <button className="doc-btn-eliminar" onClick={() => eliminarDocumento(doc.id)} title="Eliminar">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  //  FACTURA / REMITO VIEW
  // ============================================================
  return (
    <div className="documentos-page">
      {/* Header */}
      <div className="doc-header">
        <h1>{vista === 'factura' ? 'Nueva Factura' : 'Nuevo Remito'}</h1>
        <div className="doc-header-btns">
          <button className="doc-btn-volver" onClick={volverDashboard}>
            ← Volver
          </button>
          <button className="doc-btn-guardar" onClick={guardarDocumento}>
            Guardar documento
          </button>
          <button className="doc-btn-imprimir" onClick={imprimir}>
            Imprimir
          </button>
        </div>
      </div>

      {/* Cargar desde orden */}
      <div className="doc-cargar-orden">
        <div className="doc-form-grupo" style={{ flex: 1 }}>
          <label>Cargar datos desde una orden existente</label>
          <select
            value={ordenSeleccionada}
            onChange={(e) => setOrdenSeleccionada(e.target.value)}
          >
            <option value="">-- Seleccionar orden --</option>
            {ordenes.map((o) => (
              <option key={o._id} value={o._id}>
                #{o._id.slice(-6).toUpperCase()} — {o.comprador?.nombre || o.nombreComprador || 'Sin nombre'} — {formatMoneda(o.total)}
              </option>
            ))}
          </select>
        </div>
        <button className="doc-btn-cargar" onClick={cargarDesdeOrden} disabled={!ordenSeleccionada || cargandoOrdenes}>
          Cargar
        </button>
      </div>

      {/* Datos del documento */}
      <div className="doc-form-section">
        <h3>Datos del documento</h3>
        <div className="doc-form-row">
          <div className="doc-form-grupo">
            <label>Numero</label>
            <input value={datos.numero} onChange={(e) => cambiarCampo('numero', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>Fecha</label>
            <input type="date" value={datos.fecha} onChange={(e) => cambiarCampo('fecha', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>Condicion de venta</label>
            <select value={datos.condicionVenta} onChange={(e) => cambiarCampo('condicionVenta', e.target.value)}>
              <option>Contado</option>
              <option>Cuenta Corriente</option>
              <option>Transferencia</option>
              <option>MercadoPago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datos del emisor */}
      <div className="doc-form-section">
        <h3>Datos del emisor</h3>
        <div className="doc-form-row">
          <div className="doc-form-grupo">
            <label>Nombre / Razon social</label>
            <input value={datos.emisorNombre} onChange={(e) => cambiarCampo('emisorNombre', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>CUIT</label>
            <input value={datos.emisorCuit} onChange={(e) => cambiarCampo('emisorCuit', e.target.value)} placeholder="XX-XXXXXXXX-X" />
          </div>
        </div>
        <div className="doc-form-row">
          <div className="doc-form-grupo">
            <label>Direccion</label>
            <input value={datos.emisorDireccion} onChange={(e) => cambiarCampo('emisorDireccion', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>Telefono</label>
            <input value={datos.emisorTelefono} onChange={(e) => cambiarCampo('emisorTelefono', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>Email</label>
            <input value={datos.emisorEmail} onChange={(e) => cambiarCampo('emisorEmail', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="doc-form-section">
        <h3>Datos del cliente</h3>
        <div className="doc-form-row">
          <div className="doc-form-grupo">
            <label>Nombre / Razon social</label>
            <input value={datos.clienteNombre} onChange={(e) => cambiarCampo('clienteNombre', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>CUIT / DNI</label>
            <input value={datos.clienteCuit} onChange={(e) => cambiarCampo('clienteCuit', e.target.value)} />
          </div>
        </div>
        <div className="doc-form-row">
          <div className="doc-form-grupo">
            <label>Direccion</label>
            <input value={datos.clienteDireccion} onChange={(e) => cambiarCampo('clienteDireccion', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>Telefono</label>
            <input value={datos.clienteTelefono} onChange={(e) => cambiarCampo('clienteTelefono', e.target.value)} />
          </div>
          <div className="doc-form-grupo">
            <label>Email</label>
            <input value={datos.clienteEmail} onChange={(e) => cambiarCampo('clienteEmail', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="doc-form-section">
        <div className="doc-items-header">
          <h3>Detalle</h3>
          <button className="doc-btn-agregar" onClick={agregarItem}>+ Agregar item</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="doc-items-tabla">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Descripcion</th>
                <th style={{ width: '12%' }}>Cant.</th>
                <th style={{ width: '18%' }}>Precio Unit.</th>
                <th style={{ width: '18%' }}>Subtotal</th>
                <th style={{ width: '7%' }}></th>
              </tr>
            </thead>
            <tbody>
              {datos.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      value={item.descripcion}
                      onChange={(e) => cambiarItem(idx, 'descripcion', e.target.value)}
                      placeholder="Descripcion del producto o servicio"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => cambiarItem(idx, 'cantidad', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(e) => cambiarItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoneda(subtotalItem(item))}
                  </td>
                  <td>
                    <button className="doc-btn-quitar" onClick={() => quitarItem(idx)} title="Quitar">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="doc-total-row">
          <span>TOTAL:</span>
          <span>{formatMoneda(datos.tipo === 'factura' ? totalItems * 1.21 : totalItems)}</span>
        </div>
      </div>

      {/* Notas */}
      <div className="doc-form-section">
        <h3>Observaciones</h3>
        <textarea
          rows={3}
          value={datos.notas}
          onChange={(e) => cambiarCampo('notas', e.target.value)}
          placeholder="Notas adicionales, condiciones, etc."
          style={{ width: '100%', resize: 'vertical' }}
          className="doc-form-grupo"
        />
      </div>

      {/* ─── Print Preview ───────────────────── */}
      <div className="doc-preview">
        {/* WATERMARK */}
        <div
          className="doc-watermark"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '320px',
            height: '320px',
            backgroundImage: `url(${LOGO_BASE64})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.07,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          aria-hidden="true"
        />

        {/* Header con logo */}
        <div className="doc-preview-header" style={{ position: 'relative', zIndex: 1 }}>
          <div className="doc-logo-area">
            <img src={LOGO_BASE64} alt="Matecitos" className="doc-logo-img" />
            <div className="doc-logo-text">
              <span className="doc-logo-nombre">{datos.emisorNombre || 'Matecitos'}</span>
              <span className="doc-logo-slogan">Mates artesanales & accesorios</span>
            </div>
          </div>
          <div className="doc-tipo-doc">
            <div className="doc-tipo-titulo">{tituloDoc}</div>
            <div className="doc-tipo-numero">N.° {datos.numero}</div>
            <div className="doc-tipo-fecha">Fecha: {datos.fecha}</div>
          </div>
        </div>

        {/* Datos emisor / cliente */}
        <div className="doc-datos-section" style={{ position: 'relative', zIndex: 1 }}>
          <div className="doc-datos-bloque">
            <h4>Emisor</h4>
            <p><strong>{datos.emisorNombre || '—'}</strong></p>
            {datos.emisorCuit && <p>CUIT: {datos.emisorCuit}</p>}
            {datos.emisorDireccion && <p>{datos.emisorDireccion}</p>}
            {datos.emisorTelefono && <p>Tel: {datos.emisorTelefono}</p>}
            {datos.emisorEmail && <p>{datos.emisorEmail}</p>}
          </div>
          <div className="doc-datos-bloque">
            <h4>Cliente</h4>
            <p><strong>{datos.clienteNombre || '—'}</strong></p>
            {datos.clienteCuit && <p>CUIT/DNI: {datos.clienteCuit}</p>}
            {datos.clienteDireccion && <p>{datos.clienteDireccion}</p>}
            {datos.clienteTelefono && <p>Tel: {datos.clienteTelefono}</p>}
            {datos.clienteEmail && <p>{datos.clienteEmail}</p>}
          </div>
        </div>

        {/* Condicion de venta */}
        <p style={{ fontSize: '0.83rem', color: '#636e72', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
          <strong>Condicion de venta:</strong> {datos.condicionVenta}
        </p>

        {/* Tabla items */}
        <table className="doc-preview-tabla" style={{ position: 'relative', zIndex: 1 }}>
          <thead>
            <tr>
              <th>Descripcion</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {datos.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.descripcion || '—'}</td>
                <td>{item.cantidad}</td>
                <td>{formatMoneda(item.precioUnitario)}</td>
                <td>{formatMoneda(subtotalItem(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="doc-preview-totales" style={{ position: 'relative', zIndex: 1 }}>
          <div className="doc-totales-tabla">
            <div className="doc-totales-fila">
              <span>Subtotal</span>
              <span>{formatMoneda(totalItems)}</span>
            </div>
            {datos.tipo === 'factura' && (
              <>
                <div className="doc-totales-fila">
                  <span>IVA (21%)</span>
                  <span>{formatMoneda(totalItems * 0.21)}</span>
                </div>
                <div className="doc-totales-fila total">
                  <span>TOTAL</span>
                  <span>{formatMoneda(totalItems * 1.21)}</span>
                </div>
              </>
            )}
            {datos.tipo === 'remito' && (
              <div className="doc-totales-fila total">
                <span>TOTAL</span>
                <span>{formatMoneda(totalItems)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        {datos.notas && (
          <div className="doc-notas" style={{ position: 'relative', zIndex: 1 }}>
            <div className="doc-notas-label">Observaciones</div>
            {datos.notas}
          </div>
        )}

        {/* Firmas */}
        <div className="doc-firmas" style={{ position: 'relative', zIndex: 1 }}>
          <div className="doc-firma-linea">Firma y aclaracion del emisor</div>
          <div className="doc-firma-linea">
            {datos.tipo === 'remito' ? 'Firma y aclaracion del receptor' : 'Firma y aclaracion del cliente'}
          </div>
        </div>

        {/* Footer */}
        <div className="doc-preview-footer" style={{ position: 'relative', zIndex: 1 }}>
          {datos.tipo === 'factura'
            ? 'Documento no fiscal — Este comprobante no tiene validez tributaria'
            : 'Documento no fiscal — Remito de entrega de mercaderia'}
        </div>
      </div>

      {/* ─── Historial filtrado ─────────────── */}
      <div className="doc-historial-section">
        <h2>Historial de {vista === 'factura' ? 'facturas' : 'remitos'}</h2>
        {historialFiltrado.length === 0 ? (
          <p className="doc-historial-vacio">
            No hay {vista === 'factura' ? 'facturas' : 'remitos'} guardados todavia.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="doc-historial-tabla">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Numero</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className={`doc-badge doc-badge-${doc.tipo}`}>
                        {doc.tipo === 'factura' ? 'Factura' : 'Remito'}
                      </span>
                    </td>
                    <td className="doc-mono">{doc.numero}</td>
                    <td>{formatFecha(doc.fecha)}</td>
                    <td>{doc.clienteNombre || '—'}</td>
                    <td className="doc-mono">{formatMoneda(doc.total)}</td>
                    <td className="doc-acciones-cell">
                      <button className="doc-btn-ver" onClick={() => verDocumento(doc)} title="Ver / reimprimir">
                        Ver
                      </button>
                      <button className="doc-btn-eliminar" onClick={() => eliminarDocumento(doc.id)} title="Eliminar">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
