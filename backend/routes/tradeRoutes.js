const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');

// Routes
router.post('/initiate', tradeController.initiateTrade);
router.get('/:auctionId', tradeController.getTrades);
router.post('/respond', tradeController.respondTrade);

module.exports = router;
