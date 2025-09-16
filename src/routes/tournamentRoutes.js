const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', tournamentController.getAllTournaments);
router.post('/', protect, isAdmin, tournamentController.createTournament);
router.get('/:id', tournamentController.getTournamentById);

module.exports = router;