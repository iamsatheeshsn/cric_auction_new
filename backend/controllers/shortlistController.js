const { TeamShortlist, Player, Team, AuctionPlayer, ScoreBall, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.addToShortlist = async (req, res) => {
    try {
        const { team_id, player_id, priority, notes } = req.body;

        const exists = await TeamShortlist.findOne({ where: { team_id, player_id } });
        if (exists) {
            return res.status(400).json({ message: 'Player already in shortlist' });
        }

        const item = await TeamShortlist.create({
            team_id,
            player_id,
            priority: priority || 1,
            notes
        });

        res.status(201).json(item);
    } catch (error) {
        console.error("Error adding to shortlist:", error);
        res.status(500).json({ message: 'Error adding to shortlist' });
    }
};

exports.removeFromShortlist = async (req, res) => {
    try {
        const { id } = req.params;
        await TeamShortlist.destroy({ where: { id } });
        res.json({ message: 'Removed from shortlist' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing from shortlist' });
    }
};

exports.getShortlist = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { auctionId } = req.query; // Optional context

        const shortlist = await TeamShortlist.findAll({
            where: { team_id: teamId },
            include: [{
                model: Player,
                attributes: ['id', 'name', 'role', 'image_path', 'batting_type', 'bowling_type']
            }],
            order: [['priority', 'ASC'], ['createdAt', 'DESC']]
        });

        // Enrich with Auction Status if auctionId is provided
        let enrichedList = [];
        if (auctionId) {
            const playerIds = shortlist.map(s => s.player_id);
            const auctionPlayers = await AuctionPlayer.findAll({
                where: {
                    auction_id: auctionId,
                    player_id: { [Op.in]: playerIds }
                }
            });

            // Map status back to shortlist
            enrichedList = shortlist.map(item => {
                const ap = auctionPlayers.find(a => a.player_id === item.player_id);
                const itemJSON = item.toJSON();
                if (ap) {
                    itemJSON.auctionStatus = ap.status; // Available, Sold, Unsold
                    itemJSON.soldPrice = ap.sold_price;
                    itemJSON.basePrice = ap.points;
                    itemJSON.orderId = ap.order_id;
                } else {
                    itemJSON.auctionStatus = 'Not Registered';
                }
                return itemJSON;
            });
        } else {
            enrichedList = shortlist;
        }

        res.json(enrichedList);
    } catch (error) {
        console.error("Error fetching shortlist:", error);
        res.status(500).json({ message: 'Error fetching shortlist' });
    }
};
