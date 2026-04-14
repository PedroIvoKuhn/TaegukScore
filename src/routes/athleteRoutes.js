const express = require('express');
const router = express.Router();
const multer = require('multer');
const athleteController = require('../controllers/athleteController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  '/upload/tournament/:tournamentId',
  protect,
  isAdmin,
  upload.single('pdfFile'),
  athleteController.uploadAthletesFromPDF
);

module.exports = router;