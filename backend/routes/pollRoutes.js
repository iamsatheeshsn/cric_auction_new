const express = require('express');
const router = express.Router();
const { Poll, PollVote } = require('../models');

// Get active poll
router.get('/active/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;
        const poll = await Poll.findOne({
            where: { auction_id: auctionId, is_active: true },
            include: [{ model: PollVote }] // Include votes to calculate percentages on load
        });
        res.json(poll); // Returns null if no active poll
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch poll" });
    }
});

module.exports = router;
