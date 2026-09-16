import { useState, useRef } from 'react';
import { subirArchivos, eliminarArchivo } from '../services/api';
import './SubidaArchivos.css';

function SubidaArchivos({ imagenes = [], videos = [], onChange }) {
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState('');
  const inputRef = useRef(null);

  const handleSeleccion = async (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length === 0) return;

    setSubiendo(true);
    setProgreso(`Subiendo ${archivos.length} archivo(s)...`);

    try {
      const resultado = await subirArchivos(archivos);

      if (resultado.exito) {
        const nuevasImagenes = [...imagenes];
        const nuevosVideos = [...videos];

        for (const item of resultado.datos) {
          if (item.tipo === 'imagen') {
            nuevasImagenes.push({ url: item.url, publicId: item.publicId });
          } else {
            nuevosVideos.push({ url: item.url, publicId: item.publicId });
          }
        }

        onChange({ imagenes: nuevasImagenes, videos: nuevosVideos });
        setProgreso('');
      } else {
        setProgreso(`Error: ${resultado.mensaje}`);
      }
    } catch (err) {
      setProgreso(`Error: ${err.message}`);
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleEliminarImagen = async (index) => {
    const img = imagenes[index];
    try {
      await eliminarArchivo(img.publicId, 'imagen');
      const nuevas = imagenes.filter((_, i) => i !== index);
      onChange({ imagenes: nuevas, videos });
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
    }
  };

  const handleEliminarVideo = async (index) => {
    const vid = videos[index];
    try {
      await eliminarArchivo(vid.publicId, 'video');
      const nuevos = videos.filter((_, i) => i !== index);
      onChange({ imagenes, videos: nuevos });
    } catch (err) {
      console.error('Error al eliminar video:', err);
    }
  };

  return (
    <div className="subida-archivos">
      <label className="subida-label">Imagenes y Videos</label>

      <div
        className={`subida-zona ${subiendo ? 'subiendo' : ''}`}
        onClick={() => !subiendo && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={handleSeleccion}
          style={{ display: 'none' }}
        />
        {subiendo ? (
          <div className="subida-spinner">
            <div className="spinner" />
            <span>{progreso}</span>
          </div>
        ) : (
          <div className="subida-placeholder">
            <span className="subida-icono">📷</span>
            <span className="subida-texto-principal">Toca para sacar una foto o elegir archivos</span>
            <span className="subida-hint">JPG, PNG, WebP, MP4, MOV - Max. 50 MB</span>
          </div>
        )}
      </div>

      {progreso && !subiendo && progreso.startsWith('Error') && (
        <p className="subida-error">{progreso}</p>
      )}

      {imagenes.length > 0 && (
        <div className="subida-previews">
          <span className="subida-seccion-titulo">Imagenes ({imagenes.length})</span>
          <div className="previews-grid">
            {imagenes.map((img, i) => (
              <div key={img.publicId} className="preview-item">
                <img src={img.url} alt={`Imagen ${i + 1}`} />
                <button
                  type="button"
                  className="preview-eliminar"
                  onClick={() => handleEliminarImagen(i)}
                  title="Eliminar imagen"
                >
                  ✕
                </button>
                {i === 0 && <span className="preview-badge">Principal</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="subida-previews">
          <span className="subida-seccion-titulo">Videos ({videos.length})</span>
          <div className="previews-grid">
            {videos.map((vid, i) => (
              <div key={vid.publicId} className="preview-item preview-video">
                <video src={vid.url} controls preload="metadata" />
                <button
                  type="button"
                  className="preview-eliminar"
                  onClick={() => handleEliminarVideo(i)}
                  title="Eliminar video"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubidaArchivos;
