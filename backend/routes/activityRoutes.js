const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

router.get('/:userId', activityController.getRecentActivity);

module.exports = router;
