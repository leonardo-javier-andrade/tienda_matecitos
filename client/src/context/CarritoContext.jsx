import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CarritoContext = createContext();

export function useCarrito() {
  return useContext(CarritoContext);
}

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const guardado = localStorage.getItem('carrito');
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  const [abierto, setAbierto] = useState(false);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('carrito', JSON.stringify(items));
    } catch {}
  }, [items]);

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
    totalItems,
    totalPrecio,
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
}
