import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { obtenerCarritoDB, guardarCarritoDB, getUsuarioLocal } from '../services/api';

const CarritoContext = createContext();

export function useCarrito() {
  return useContext(CarritoContext);
}

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);
  const syncRef = useRef(null);

  const isLoggedIn = () => {
    try {
      return !!localStorage.getItem('user_token');
    } catch {
      return false;
    }
  };

  // Cargar carrito al inicio
  useEffect(() => {
    const cargar = async () => {
      if (isLoggedIn()) {
        try {
          const res = await obtenerCarritoDB();
          if (res.exito && Array.isArray(res.datos)) {
            setItems(res.datos);
            // Limpiar localStorage al migrar a DB
            try { localStorage.removeItem('carrito'); } catch {}
          }
        } catch {
          // Fallback: intentar localStorage
          try {
            const guardado = localStorage.getItem('carrito');
            if (guardado) setItems(JSON.parse(guardado));
          } catch {}
        }
      } else {
        // Guest: usar localStorage
        try {
          const guardado = localStorage.getItem('carrito');
          if (guardado) setItems(JSON.parse(guardado));
        } catch {}
      }
      setCargado(true);
    };
    cargar();
  }, []);

  // Sincronizar con DB o localStorage cuando cambian items
  useEffect(() => {
    if (!cargado) return;

    // Debounce para evitar múltiples llamadas
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => {
      if (isLoggedIn()) {
        guardarCarritoDB(items).catch(() => {});
      } else {
        try {
          localStorage.setItem('carrito', JSON.stringify(items));
        } catch {}
      }
    }, 500);

    return () => {
      if (syncRef.current) clearTimeout(syncRef.current);
    };
  }, [items, cargado]);

  // Escuchar cambios de login/logout para recargar carrito
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'user_token') {
        if (e.newValue) {
          // Login: cargar carrito de DB
          obtenerCarritoDB().then((res) => {
            if (res.exito && Array.isArray(res.datos)) {
              setItems(res.datos);
            }
          }).catch(() => {});
        } else {
          // Logout: limpiar carrito
          setItems([]);
          try { localStorage.removeItem('carrito'); } catch {}
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const agregarItem = useCallback((producto, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === producto._id);
      if (existente) {
        return prev.map((i) =>
          i.productoId === producto._id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [
        ...prev,
        {
          productoId: producto._id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagenes?.[0]?.url || '',
          cantidad,
          stock: producto.stock,
        },
      ];
    });
    setAbierto(true);
  }, []);

  const quitarItem = useCallback((productoId) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const actualizarCantidad = useCallback((productoId, cantidad) => {
    if (cantidad < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.productoId === productoId ? { ...i, cantidad } : i
      )
    );
  }, []);

  const vaciarCarrito = useCallback(() => {
    setItems([]);
  }, []);

  // Recargar desde DB (llamar después de login)
  const recargarCarrito = useCallback(async () => {
    if (isLoggedIn()) {
      try {
        const res = await obtenerCarritoDB();
        if (res.exito && Array.isArray(res.datos)) {
          setItems(res.datos);
        }
      } catch {}
    }
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrecio = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const value = {
    items,
    abierto,
    setAbierto,
    agregarItem,
    quitarItem,
    actualizarCantidad,
    vaciarCarrito,
    recargarCarrito,
    totalItems,
    totalPrecio,
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
}
