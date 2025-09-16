// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rota pública para login
router.post('/login', authController.login);

// Rota protegida para buscar os dados do próprio usuário logado
router.get('/me', protect, authController.getMe);

module.exports = router;