const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const upload = require('../middleware/upload');

console.log("Loading Player Routes...");

// Create Player (with image upload)
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'payment_screenshot', maxCount: 1 }
]), playerController.createPlayer);

// Bulk Import
router.post('/bulk-import', upload.single('file'), playerController.createPlayersBulk);

// Update Player
router.put('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'payment_screenshot', maxCount: 1 }
]), playerController.updatePlayer);

// Get Players by Auction
router.get('/auction/:auctionId', playerController.getPlayersByAuction);
router.get('/', playerController.getAllPlayers); // Global Players Route
router.get('/v2/auction/:auctionId', playerController.getPlayersByAuction); // V2 Route for debugging/bypassing cache

// Auction Actions
router.get('/unregistered/:auctionId', playerController.getUnregisteredPlayers);
router.post('/register', playerController.registerPlayer);
router.post('/regenerate-pids', playerController.regeneratePlayerIds);
router.post('/:id/sold', playerController.markSold);
router.post('/:id/unsold', playerController.markUnsold);
router.put('/:id/revisit', playerController.revisitPlayer);

// Delete Player
router.delete('/:id', playerController.deletePlayer);

module.exports = router;
