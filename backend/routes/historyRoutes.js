const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/tournaments', historyController.getPastTournaments);
router.get('/hall-of-fame', historyController.getHallOfFame);
router.get('/career/:playerId', historyController.getPlayerCareer);

module.exports = router;
