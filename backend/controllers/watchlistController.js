const { Watchlist, Player, Team, AuctionPlayer, Auction } = require('../models');
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Watchlist.findAndCountAll({
            where: { user_id: userId },
            include: [{
                model: Player,
                include: [{
                    model: AuctionPlayer,
                    include: [
                        { model: Auction, attributes: ['name', 'status', 'image_path'] },
                        { model: Team, attributes: ['name', 'short_name', 'image_path'] }
                    ]
                }]
            }],
            limit,
            offset,
            distinct: true
        });

        const players = await Promise.all(rows.map(async item => {
            const p = item.Player.toJSON();
            const stats = await getPlayerStats(p.id);

            // Format Auction Data
            const auctionData = (p.AuctionPlayers || []).map(ap => ({
                auction_name: ap.Auction ? ap.Auction.name : 'Unknown Auction',
                auction_image: ap.Auction ? ap.Auction.image_path : null,
                auction_status: ap.Auction ? ap.Auction.status : 'Unknown',
                status: ap.status,
                sold_price: ap.sold_price,
                team: ap.Team ? ap.Team.short_name : null,
                team_image: ap.Team ? ap.Team.image_path : null,
                is_owner: ap.is_owner
            }));

            // Consolidate status for display (if requested simple view) or just pass array
            // User requested "different auctions", so passing the array is best.
            // However, to keep backward compatibility with the current simplified view:
            // We can set root 'status' to the most recent active auction status, BUT
            // it is better to return the full list.

            return {
                ...p,
                stats,
                auctions: auctionData,
                // Fallback for simple display: Use the latest auction entry
                status: auctionData.length > 0 ? auctionData[0].status : null,
                sold_price: auctionData.length > 0 ? auctionData[0].sold_price : null,
                Team: auctionData.length > 0 && auctionData[0].team ? { short_name: auctionData[0].team } : null
            };
        }));

        res.json({
            players,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalItems: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
