const { Watchlist, Player, Team, AuctionPlayer } = require('../models');
const { getPlayerStats } = require('../utils/statsHelper');

exports.addToWatchlist = async (req, res) => {
    try {
        const { user_id, player_id } = req.body;

        if (!user_id || !player_id) {
            return res.status(400).json({ message: 'User ID and Player ID are required' });
        }

        const exists = await Watchlist.findOne({ where: { user_id, player_id } });
        if (exists) {
            return res.status(400).json({ message: 'Player already in watchlist' });
        }

        await Watchlist.create({ user_id, player_id });
        res.status(201).json({ message: 'Added to watchlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.removeFromWatchlist = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { user_id } = req.body; // Assuming sent in body or query, or authenticated user

        // For flexibility, handle user_id from query if not in body
        const userId = user_id || req.query.user_id;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await Watchlist.destroy({ where: { user_id: userId, player_id: playerId } });
        res.json({ message: 'Removed from watchlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getWatchlist = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const watchlist = await Watchlist.findAll({
            where: { user_id: userId },
            include: [{
                model: Player
            }]
        });

        // We might want to enrich this with current Auction status (Sold/Unsold) if not directly on Player
        // But Player model usually has status. Let's return the simplified list.


        const players = await Promise.all(watchlist.map(async item => {
            const p = item.Player.toJSON();
            const stats = await getPlayerStats(p.id);
            return { ...p, stats };
        }));

        res.json({ players });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
