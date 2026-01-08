const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');

// POST /api/watchlist - Add to watchlist
router.post('/', watchlistController.addToWatchlist);

// DELETE /api/watchlist/:playerId - Remove from watchlist (requires user_id in body/query)
router.delete('/:playerId', watchlistController.removeFromWatchlist);

// GET /api/watchlist/:userId - Get user's watchlist
router.get('/:userId', watchlistController.getWatchlist);

module.exports = router;
