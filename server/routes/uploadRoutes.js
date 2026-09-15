const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { verificarAdmin } = require('../middleware/auth');

const router = express.Router();

// Configurar Multer para almacenar en memoria (luego sube a Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB máximo (para videos)
  },
  fileFilter: (_req, file, cb) => {
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'video/mp4',
      'video/quicktime', // .mov desde iPhone
      'video/webm',
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  },
});

/**
 * POST /api/upload
 * Sube una o varias imágenes/videos a Cloudinary.
 * Devuelve las URLs y public_ids para guardar en el producto.
 */
router.post('/', verificarAdmin, upload.array('archivos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se enviaron archivos.',
      });
    }

    const resultados = [];

    for (const archivo of req.files) {
      const esVideo = archivo.mimetype.startsWith('video/');

      // Subir a Cloudinary usando stream
      const resultado = await new Promise((resolve, reject) => {
        const opciones = {
          folder: 'tienda-matecitos',
          resource_type: esVideo ? 'video' : 'image',
        };

        // Para imágenes: optimizar automáticamente
        if (!esVideo) {
          opciones.transformation = [
            { quality: 'auto', fetch_format: 'auto' },
          ];
        }

        // Para videos: limitar duración y calidad
        if (esVideo) {
          opciones.eager = [
            { quality: 'auto', format: 'mp4' },
          ];
          opciones.eager_async = true;
        }

        const stream = cloudinary.uploader.upload_stream(opciones, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });

        stream.end(archivo.buffer);
      });

      resultados.push({
        url: resultado.secure_url,
        publicId: resultado.public_id,
        tipo: esVideo ? 'video' : 'imagen',
        ancho: resultado.width,
        alto: resultado.height,
        formato: resultado.format,
        tamaño: resultado.bytes,
      });
    }

    res.json({
      exito: true,
      mensaje: `${resultados.length} archivo(s) subido(s) exitosamente.`,
      datos: resultados,
    });
  } catch (error) {
    console.error('Error al subir archivos:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error al subir archivos.',
    });
  }
});

/**
 * DELETE /api/upload
 * Elimina un archivo de Cloudinary.
 * El publicId se envía como query param porque contiene "/".
 * Ej: DELETE /api/upload?publicId=tienda-matecitos/abc123&tipo=imagen
 */
router.delete('/', verificarAdmin, async (req, res) => {
  try {
    const { publicId, tipo } = req.query;

    if (!publicId) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El publicId es obligatorio.',
      });
    }

    const resourceType = tipo === 'video' ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    res.json({
      exito: true,
      mensaje: 'Archivo eliminado de Cloudinary.',
    });
  } catch (error) {
    console.error('Error al eliminar archivo:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar el archivo.',
    });
  }
});

module.exports = router;
