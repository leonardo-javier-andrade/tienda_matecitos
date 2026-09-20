import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  crearProducto,
  actualizarProducto,
  obtenerProductoPorId,
  obtenerTodasCategorias,
} from '../../services/api';
import SubidaArchivos from '../../components/SubidaArchivos';
import './FormularioProducto.css';

const productoVacio = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: 0,
  costoUnitario: '',
  imagenes: [],
  videos: [],
  categoria: '',
  destacado: false,
  promocionCentro: false,
  imagenHero: null,
  activo: true,
};

function FormularioProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [producto, setProducto] = useState(productoVacio);
  const [categorias, setCategorias] = useState([]);
  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resCat = await obtenerTodasCategorias();
        const cats = resCat.datos || [];
        setCategorias(cats);

        if (esEdicion) {
          const { datos } = await obtenerProductoPorId(id);
          setProducto({
            nombre: datos.nombre,
            descripcion: datos.descripcion || '',
            precio: datos.precio,
            stock: datos.stock,
            costoUnitario: datos.costoUnitario || '',
            imagenes: datos.imagenes || [],
            videos: datos.videos || [],
            categoria: datos.categoria,
            destacado: datos.destacado,
            promocionCentro: datos.promocionCentro || false,
            imagenHero: datos.imagenHero || null,
            activo: datos.activo,
          });
        } else {
          const activas = cats.filter((c) => c.activo);
          if (activas.length > 0) {
            setProducto((prev) => ({ ...prev, categoria: activas[0].nombre }));
          }
        }
      } catch {
        setErrores(['No se pudo cargar los datos.']);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
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
      costoUnitario: Number(producto.costoUnitario) || 0,
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
      setErrores(['Error de conexion con el servidor.']);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="form-container">
        <p className="form-cargando">Cargando...</p>
      </div>
    );
  }

  const categoriasActivas = categorias.filter((c) => c.activo);

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
          <label htmlFor="descripcion">Descripcion</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={producto.descripcion}
            onChange={handleChange}
            placeholder="Descripcion del producto..."
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
            <label htmlFor="costoUnitario">Costo unitario (ARS)</label>
            <input
              id="costoUnitario"
              name="costoUnitario"
              type="number"
              min="0"
              step="0.01"
              value={producto.costoUnitario}
              onChange={handleChange}
              placeholder="0.00"
            />
            {producto.precio && producto.costoUnitario ? (
              <small style={{ color: Number(producto.precio) - Number(producto.costoUnitario) > 0 ? '#00b894' : '#d63031', marginTop: '0.25rem', display: 'block' }}>
                Margen: ${(Number(producto.precio) - Number(producto.costoUnitario)).toFixed(2)} ({((Number(producto.precio) - Number(producto.costoUnitario)) / Number(producto.precio) * 100).toFixed(1)}%)
              </small>
            ) : null}
          </div>

          <div className="form-grupo">
            <label htmlFor="categoria">Categoria *</label>
            <select
              id="categoria"
              name="categoria"
              value={producto.categoria}
              onChange={handleChange}
            >
              {categoriasActivas.map((cat) => (
                <option key={cat._id} value={cat.nombre}>
                  {cat.nombre}
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
            Producto destacado
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              name="promocionCentro"
              checked={producto.promocionCentro}
              onChange={handleChange}
            />
            Promocion Centro Pag (Hero)
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              name="activo"
              checked={producto.activo}
              onChange={handleChange}
            />
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
