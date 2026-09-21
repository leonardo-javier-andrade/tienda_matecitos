const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/User');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/registro — Registrar usuario nuevo ───
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Nombre, email y contraseña son obligatorios.',
      });
    }

    // Verificar si ya existe
    const existente = await Usuario.findOne({ email });
    if (existente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe una cuenta con ese email.',
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      telefono: telefono || '',
      rol: 'usuario',
    });

    // Generar token
    const token = jwt.sign(
      { id: nuevoUsuario._id, rol: nuevoUsuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      exito: true,
      mensaje: 'Cuenta creada exitosamente.',
      token,
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error('Error en registro:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error al crear la cuenta.',
    });
  }
});

// ─── POST /api/auth/login — Login unificado (admin y usuario) ───
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Email y contraseña son obligatorios.',
      });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    // Verificar contraseña
    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    // Generar JWT
    const duracion = usuario.rol === 'admin' ? '24h' : '7d';
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: duracion }
    );

    res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: usuario.toJSON(),
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al iniciar sesión.',
    });
  }
});

// ─── GET /api/auth/verificar — Verificar token y devolver datos ───
router.get('/verificar', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(401).json({ exito: false, valido: false });
    }

    res.json({
      exito: true,
      valido: true,
      usuario: usuario.toJSON(),
    });
  } catch {
    res.status(401).json({ exito: false, valido: false });
  }
});

// ─── PUT /api/auth/perfil — Actualizar perfil del usuario ───
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado.',
      });
    }

    if (nombre) usuario.nombre = nombre;
    if (telefono !== undefined) usuario.telefono = telefono;

    await usuario.save();

    res.json({
      exito: true,
      mensaje: 'Perfil actualizado.',
      usuario: usuario.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar perfil.',
    });
  }
});

// ─── POST /api/auth/favorito/:productoId — Toggle favorito ───
router.post('/favorito/:productoId', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    const { productoId } = req.params;

    const index = usuario.favoritos.indexOf(productoId);
    if (index === -1) {
      usuario.favoritos.push(productoId);
    } else {
      usuario.favoritos.splice(index, 1);
    }

    await usuario.save();

    res.json({
      exito: true,
      favoritos: usuario.favoritos,
      agregado: index === -1,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar favoritos.',
    });
  }
});

// ─── GET /api/auth/favoritos — Obtener favoritos del usuario ───
router.get('/favoritos', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).populate('favoritos');
    res.json({
      exito: true,
      datos: usuario.favoritos,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener favoritos.',
    });
  }
});

// ─── POST /api/auth/seed-admin — Crear admin inicial (solo si no existe) ───
router.post('/seed-admin', async (_req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({
        exito: false,
        mensaje: 'ADMIN_EMAIL y ADMIN_PASSWORD deben estar configurados en .env',
      });
    }

    const existente = await Usuario.findOne({ rol: 'admin' });
    if (existente) {
      return res.json({
        exito: true,
        mensaje: 'Ya existe un administrador.',
        admin: existente.email,
      });
    }

    await Usuario.create({
      nombre: 'Administrador',
      email: adminEmail,
      password: adminPassword,
      rol: 'admin',
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Administrador creado exitosamente.',
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear administrador.',
    });
  }
});

module.exports = router;

// ─── CARRITO EN BASE DE DATOS ─────────────────────────

// GET /api/auth/carrito — Obtener carrito del usuario
router.get('/carrito', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('carrito');
    res.json({ exito: true, datos: usuario?.carrito || [] });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error al obtener carrito.' });
  }
});

// PUT /api/auth/carrito — Guardar/reemplazar carrito del usuario
router.put('/carrito', verificarToken, async (req, res) => {
  try {
    const { items } = req.body;
    await Usuario.findByIdAndUpdate(req.usuario.id, { carrito: items || [] });
    res.json({ exito: true, mensaje: 'Carrito actualizado.' });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar carrito.' });
  }
});
