import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './ResultadoOrden.css';

function ResultadoOrden() {
  const [params] = useSearchParams();
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    const status = params.get('status') || params.get('collection_status');
    const paymentId = params.get('payment_id');

    if (status === 'approved') {
      setEstado('aprobado');
      // Limpiar carrito
      try { localStorage.removeItem('carrito'); } catch {}
    } else if (status === 'pending' || status === 'in_process') {
      setEstado('pendiente');
      try { localStorage.removeItem('carrito'); } catch {}
    } else {
      setEstado('rechazado');
    }
  }, [params]);

  const contenido = {
    cargando: {
      icon: '⏳',
      titulo: 'Procesando...',
      mensaje: 'Estamos verificando tu pago.',
      clase: '',
    },
    aprobado: {
      icon: '✅',
      titulo: '¡Pago aprobado!',
      mensaje: 'Tu pedido fue procesado con éxito. Te enviaremos las novedades por email y WhatsApp.',
      clase: 'resultado-aprobado',
    },
    pendiente: {
      icon: '🕐',
      titulo: 'Pago pendiente',
      mensaje: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
      clase: 'resultado-pendiente',
    },
    rechazado: {
      icon: '❌',
      titulo: 'Pago no realizado',
      mensaje: 'El pago no pudo ser procesado. Podés intentar nuevamente.',
      clase: 'resultado-rechazado',
    },
  };

  const c = contenido[estado];

  return (
    <div className="resultado-orden-page">
      <div className={`resultado-card ${c.clase}`}>
        <span className="resultado-icon">{c.icon}</span>
        <h1>{c.titulo}</h1>
        <p>{c.mensaje}</p>
        <div className="resultado-acciones">
          <Link to="/" className="resultado-btn-inicio">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResultadoOrden;
