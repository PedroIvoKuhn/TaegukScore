// src/routes/scoreRoutes.js
const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.post('/', protect, isAdmin, scoreController.submitScores);

module.exports = router;