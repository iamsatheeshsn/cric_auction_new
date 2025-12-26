const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');

router.get('/:auctionId', pointsController.getPointsTable);

module.exports = router;
