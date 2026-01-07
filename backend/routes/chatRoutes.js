const express = require('express');
const router = express.Router();
const { Message, User } = require('../models');

// Get recent messages for a room
router.get('/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { type, fixtureId } = req.query;

        const whereClause = { auction_id: auctionId };

        if (type === 'match_center' && fixtureId) {
            whereClause.type = 'match_center';
            whereClause.fixture_id = fixtureId;
        } else {
            whereClause.type = 'auction_room';
        }

        const messages = await Message.findAll({
            where: whereClause,
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
