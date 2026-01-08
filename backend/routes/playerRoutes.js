const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const upload = require('../middleware/upload');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

console.log("Loading Player Routes...");

// Create Player (with image upload)
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'payment_screenshot', maxCount: 1 }
]), playerController.createPlayer);

// Bulk Import
router.post('/bulk-import', upload.single('file'), playerController.createPlayersBulk);
router.get('/sample-csv', playerController.downloadSampleCSV);

// Update Player
router.put('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'payment_screenshot', maxCount: 1 }
]), playerController.updatePlayer);

// Get Players by Auction
router.get('/auction/:auctionId', optionalAuth, playerController.getPlayersByAuction);
router.get('/', optionalAuth, playerController.getAllPlayers); // Global Players Route
router.get('/v2/auction/:auctionId', optionalAuth, playerController.getPlayersByAuction); // V2 Route for debugging/bypassing cache

// Auction Actions
router.get('/unregistered/:auctionId', playerController.getUnregisteredPlayers);
router.post('/register', playerController.registerPlayer);
router.post('/regenerate-pids', playerController.regeneratePlayerIds);
router.post('/:id/sold', playerController.markSold);
router.post('/:id/unsold', playerController.markUnsold);
router.post('/:id/note', verifyToken, playerController.addScoutingNote); // New Route
router.put('/:id/revisit', playerController.revisitPlayer);

// Delete Player
router.delete('/:id', playerController.deletePlayer);

module.exports = router;
