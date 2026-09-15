import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  crearProducto,
  actualizarProducto,
  obtenerProductoPorId,
} from '../../services/api';
import SubidaArchivos from '../../components/SubidaArchivos';
import './FormularioProducto.css';

const CATEGORIAS = ['Mates', 'Bombillas', 'Termos', 'Yerberas', 'Kits', 'Accesorios'];

const productoVacio = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: 0,
  imagenes: [],
  videos: [],
  categoria: 'Mates',
  destacado: false,
  promocionCentro: false,
  activo: true,
};

function FormularioProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [producto, setProducto] = useState(productoVacio);
  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(esEdicion);

  useEffect(() => {
    if (esEdicion) {
      obtenerProductoPorId(id)
        .then(({ datos }) => {
          setProducto({
            nombre: datos.nombre,
            descripcion: datos.descripcion || '',
            precio: datos.precio,
            stock: datos.stock,
            imagenes: datos.imagenes || [],
            videos: datos.videos || [],
            categoria: datos.categoria,
            destacado: datos.destacado,
            promocionCentro: datos.promocionCentro || false,
            activo: datos.activo,
          });
        })
        .catch(() => setErrores(['No se pudo cargar el producto.']))
        .finally(() => setCargando(false));
    }
  }, [id, esEdicion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProducto((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleArchivosChange = ({ imagenes, videos }) => {
    setProducto((prev) => ({ ...prev, imagenes, videos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);
    setGuardando(true);

    const datosEnviar = {
      ...producto,
      precio: Number(producto.precio),
      stock: Number(producto.stock),
    };

    try {
      const resultado = esEdicion
        ? await actualizarProducto(id, datosEnviar)
        : await crearProducto(datosEnviar);

      if (resultado.exito) {
        navigate('/admin');
      } else {
        setErrores(resultado.errores || [resultado.mensaje]);
      }
    } catch {
      setErrores(['Error de conexión con el servidor.']);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="form-container">
        <p className="form-cargando">Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <button className="form-volver" onClick={() => navigate('/admin')}>
          ← Volver
        </button>
        <h1>{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h1>
      </div>

      {errores.length > 0 && (
        <div className="form-errores">
          {errores.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-grupo">
          <label htmlFor="nombre">Nombre *</label>
          <input
            id="nombre"
            name="nombre"
            value={producto.nombre}
            onChange={handleChange}
            placeholder="Ej: Mate Imperial de Algarrobo"
            required
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={producto.descripcion}
            onChange={handleChange}
            placeholder="Descripción del producto..."
            rows={3}
          />
        </div>

        <div className="form-fila">
          <div className="form-grupo">
            <label htmlFor="precio">Precio (ARS) *</label>
            <input
              id="precio"
              name="precio"
              type="number"
              min="0"
              step="0.01"
              value={producto.precio}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={producto.stock}
              onChange={handleChange}
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="categoria">Categoría *</label>
            <select
              id="categoria"
              name="categoria"
              value={producto.categoria}
              onChange={handleChange}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SubidaArchivos
          imagenes={producto.imagenes}
          videos={producto.videos}
          onChange={handleArchivosChange}
        />

        <div className="form-checks">
          <label className="check-label">
            <input
              type="checkbox"
              name="destacado"
              checked={producto.destacado}
              onChange={handleChange}
            />
            <span className="check-icono">⭐</span>
            Producto destacado
          </label>

          <label className="check-label check-promo">
            <input
              type="checkbox"
              name="promocionCentro"
              checked={producto.promocionCentro}
              onChange={handleChange}
            />
            <span className="check-icono">🎯</span>
            Promoción Centro Pág
            <span className="check-hint">Se muestra en el carrusel principal de la tienda</span>
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              name="activo"
              checked={producto.activo}
              onChange={handleChange}
            />
            <span className="check-icono">✅</span>
            Activo (visible en la tienda)
          </label>
        </div>

        <div className="form-acciones">
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => navigate('/admin')}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-guardar" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioProducto;
