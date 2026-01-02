const express = require('express');
const router = express.Router();
const fanController = require('../controllers/fanController');
const { verifyToken } = require('../middleware/authMiddleware'); // Assuming this exists

// Predictions
router.post('/prediction', verifyToken, fanController.submitPrediction);
router.get('/predictions', verifyToken, fanController.getMyPredictions);

// Fantasy
router.post('/fantasy/create', verifyToken, fanController.createFantasyTeam);
router.get('/fantasy/my-team', verifyToken, fanController.getMyFantasyTeam);

module.exports = router;
