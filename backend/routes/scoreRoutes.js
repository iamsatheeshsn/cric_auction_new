const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');

// Get Scoring Data
router.get('/match/:fixtureId', scoreController.getMatchScoringDetails);

// Update State (Toss, Status)
router.put('/match/:fixtureId/state', scoreController.updateMatchState);

// Record Ball
router.post('/match/:fixtureId/ball', scoreController.recordBall);

// Undo Ball
router.delete('/match/:fixtureId/undo', scoreController.undoLastBall);

module.exports = router;
