const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.get('/referees', protect, isAdmin, userController.getAllReferees);

module.exports = router;
