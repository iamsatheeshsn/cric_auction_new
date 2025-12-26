const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/leaderboard', statsController.getLeaderboards);
router.get('/compare', statsController.getComparison);

module.exports = router;
