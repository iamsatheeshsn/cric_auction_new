const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const upload = require('../middleware/upload');

// Create & List
router.post('/', upload.single('image'), auctionController.createAuction);
router.post('/copy-data', auctionController.copyAuctionData);
router.get('/', auctionController.getAllAuctions);

// Get Single
// Get Single
router.get('/:id/live', auctionController.getLiveAuctionData);
router.get('/:id', auctionController.getAuctionById);

// Update
// Update
// Update
router.put('/:id/current-player', auctionController.updateCurrentPlayer);
router.put('/:id/live-bid', auctionController.updateLiveBid);
router.put('/:id', upload.single('image'), auctionController.updateAuction);



// Delete
router.delete('/:id', auctionController.deleteAuction);

module.exports = router;
