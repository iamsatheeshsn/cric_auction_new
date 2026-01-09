const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Reset Auction
router.post('/reset/:id', adminController.resetAuction);

// Export Squads
router.get('/export-squads/:id', adminController.exportSquads);

// Export Logs
router.get('/export-logs/:id', adminController.exportLogs);

module.exports = router;
