const jwt = require('jsonwebtoken');

/**
 * Middleware genérico: verifica token JWT y agrega req.usuario
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. Token no proporcionado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, rol }
    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido o expirado.',
    });
  }
};

/**
 * Middleware: solo permite acceso a administradores
 */
const verificarAdmin = (req, res, next) => {
  verificarToken(req, res, () => {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado. Se requiere rol de administrador.',
      });
    }
    next();
  });
};

module.exports = { verificarToken, verificarAdmin };
