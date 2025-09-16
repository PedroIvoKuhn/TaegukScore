const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware'); 

// 1. `protect`: Verifica se o usuário está logado.
// 2. `isAdmin`: Verifica se o usuário logado é um ADMIN.
router.post('/create-referee', protect, isAdmin, adminController.createReferee);
router.post('/login', adminController.login);

module.exports = router;