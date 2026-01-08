const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/CalendarController');

router.get('/', CalendarController.getCalendarEvents);

module.exports = router;
