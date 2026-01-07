const express = require('express');
const router = express.Router();
const { Message, User } = require('../models');

// Get recent messages for an auction room
router.get('/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;
        const messages = await Message.findAll({
            where: { auction_id: auctionId },
            include: [{ model: User, attributes: ['username', 'display_name', 'avatar'] }],
            order: [['timestamp', 'ASC']],
            limit: 50 // Load last 50 messages
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
});

module.exports = router;
