const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

// Rota pública para listar todos os torneios
router.get('/', tournamentController.getAllTournaments);

module.exports = router;