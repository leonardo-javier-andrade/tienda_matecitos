const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login — Login del administrador
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      exito: false,
      mensaje: 'La contraseña es obligatoria.',
    });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Contraseña incorrecta.',
    });
  }

  // Generar JWT válido por 24 horas
  const token = jwt.sign({ rol: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  res.json({
    exito: true,
    mensaje: 'Inicio de sesión exitoso.',
    token,
  });
});

// GET /api/auth/verificar — Verificar si el token sigue siendo válido
router.get('/verificar', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ exito: false, valido: false });
  }

  try {
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    res.json({ exito: true, valido: true });
  } catch {
    res.status(401).json({ exito: false, valido: false });
  }
});

module.exports = router;
