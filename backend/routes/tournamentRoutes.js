const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { verifyToken } = require('../middleware/authMiddleware'); // Optional depending on access

// Public/Protected
// Public/Protected
router.get('/auction/:auctionId/points', tournamentController.getPointsTable);
router.post('/auction/:auctionId/generate-knockouts', tournamentController.generateKnockouts);
router.get('/auction/:auctionId/bracket', tournamentController.getBracket);
router.post('/mark-winner', tournamentController.markKnockoutWinner);

module.exports = router;
