const { Auction, Team, Player } = require('../models');
const { Op } = require('sequelize');

// Create Auction
exports.createAuction = async (req, res) => {
    try {
        console.log("Create Auction Body:", req.body);
        console.log("Create Auction File:", req.file);

        // Using Multer for file upload, so file path will be in req.file.path
        // In a real app we might want to store relative path or upload to cloud
        const imagePath = req.file ? req.file.path : null;

        const {
            name,
            auction_date,
            place,
            type,
            points_per_team,
            min_bid,
            bid_increase_by
        } = req.body;

        const newAuction = await Auction.create({
            name,
            auction_date,
            place,
            type,
            points_per_team,
            min_bid,
            bid_increase_by,
            image_path: imagePath
        });

        res.status(201).json(newAuction);
    } catch (error) {
        console.error("Error creating auction:", error);
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

// Update Auction
exports.updateAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, auction_date, place, type, points_per_team, min_bid, bid_increase_by } = req.body;
        const imagePath = req.file ? req.file.path : undefined;

        const auction = await Auction.findByPk(id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        auction.name = name || auction.name;
        auction.auction_date = auction_date || auction.auction_date;
        auction.place = place || auction.place;
        auction.type = type || auction.type;
        auction.points_per_team = points_per_team || auction.points_per_team;
        auction.min_bid = min_bid || auction.min_bid;
        auction.bid_increase_by = bid_increase_by || auction.bid_increase_by;
        if (req.body.status) auction.status = req.body.status;
        if (imagePath) auction.image_path = imagePath;

        await auction.save();
        res.json(auction);
    } catch (error) {
        res.status(500).json({ message: 'Error updating auction', error: error.message });
    }
};

// Get All Auctions
// Get All Auctions
// Get All Auctions
exports.getAllAuctions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const whereClause = {};
        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await Auction.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            auctions: rows
        });
    } catch (error) {
        console.error("Error fetching auctions:", error);
        res.status(500).json({ message: 'Error fetching auctions' });
    }
};

// Get Auction By ID
exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findByPk(req.params.id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });
        res.json(auction);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching auction' });
    }
};

// Delete Auction
exports.deleteAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findByPk(id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        await auction.destroy();
        res.json({ message: 'Auction deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting auction' });
    }
};

// Copy Auction Data
exports.copyAuctionData = async (req, res) => {
    try {
        const { sourceAuctionId, targetAuctionId, includeTeams, includePlayers } = req.body;

        if (!sourceAuctionId || !targetAuctionId) {
            return res.status(400).json({ message: 'Source and Target Auction IDs are required' });
        }

        const targetAuction = await Auction.findByPk(targetAuctionId);
        if (!targetAuction) {
            return res.status(404).json({ message: 'Target Auction not found' });
        }

        let teamsCopied = 0;
        let teamsSkipped = 0;
        let playersCopied = 0;
        let playersSkipped = 0;

        // Copy Teams
        if (includeTeams) {
            // 1. Get existing teams in target to check duplicates
            const existingTeams = await Team.findAll({
                where: { auction_id: targetAuctionId },
                attributes: ['name'], // Only need names for check
                raw: true
            });
            const existingTeamNames = new Set(existingTeams.map(t => t.name.trim().toLowerCase()));

            // 2. Get source teams
            const sourceTeams = await Team.findAll({ where: { auction_id: sourceAuctionId }, raw: true });

            if (sourceTeams.length > 0) {
                // 3. Filter out duplicates
                const newTeams = sourceTeams
                    .filter(team => !existingTeamNames.has(team.name.trim().toLowerCase()))
                    .map(team => ({
                        ...team,
                        id: undefined,
                        createdAt: undefined,
                        updatedAt: undefined,
                        auction_id: targetAuctionId,
                        purse_remaining: targetAuction.points_per_team || 0,
                        players_count: 0
                    }));

                if (newTeams.length > 0) {
                    await Team.bulkCreate(newTeams);
                }
                teamsCopied = newTeams.length;
                teamsSkipped = sourceTeams.length - newTeams.length;
            }
        }

        // Copy Players
        if (includePlayers) {
            // 1. Get existing players in target
            const existingPlayers = await Player.findAll({
                where: { auction_id: targetAuctionId },
                attributes: ['name', 'mobile_number'],
                raw: true
            });

            // Create a Set of unique keys: "name|mobile" or just "name"
            const existingPlayerKeys = new Set(existingPlayers.map(p => {
                const mobile = p.mobile_number ? p.mobile_number.toString().trim() : '';
                return `${p.name.trim().toLowerCase()}|${mobile}`;
            }));

            // 2. Get source players
            const sourcePlayers = await Player.findAll({ where: { auction_id: sourceAuctionId }, raw: true });

            if (sourcePlayers.length > 0) {
                // Get current max order_id for target auction
                const maxOrder = await Player.max('order_id', { where: { auction_id: targetAuctionId } }) || 0;
                let nextOrder = maxOrder + 1;

                // 3. Filter out duplicates
                const newPlayers = sourcePlayers
                    .filter(player => {
                        const mobile = player.mobile_number ? player.mobile_number.toString().trim() : '';
                        const key = `${player.name.trim().toLowerCase()}|${mobile}`;
                        return !existingPlayerKeys.has(key);
                    })
                    .map(player => ({
                        ...player,
                        id: undefined,
                        createdAt: undefined,
                        updatedAt: undefined,
                        auction_id: targetAuctionId,
                        team_id: null,
                        status: 'Available',
                        sold_price: 0,
                        order_id: nextOrder++ // Assign and increment
                    }));

                if (newPlayers.length > 0) {
                    await Player.bulkCreate(newPlayers);
                }
                playersCopied = newPlayers.length;
                playersSkipped = sourcePlayers.length - newPlayers.length;
            }
        }

        res.json({
            message: 'Data import process completed',
            stats: {
                teams: { imported: teamsCopied, skipped: teamsSkipped },
                players: { imported: playersCopied, skipped: playersSkipped }
            }
        });

    } catch (error) {
        console.error("Error copying data:", error);
        if (error.name === 'SequelizeValidationError') {
            console.error("Validation Errors:", error.errors.map(e => e.message));
        }
        res.status(500).json({ message: 'Error copying data', error: error.message, details: error.errors });
    }
};

// Get Live Auction Data (Spectator View)
exports.getLiveAuctionData = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findByPk(id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Get Last Sold Player
        const lastSold = await Player.findOne({
            where: { auction_id: id, status: 'Sold' },
            order: [['updatedAt', 'DESC']],
            include: [{ model: Team, as: 'Team', attributes: ['name', 'short_name'] }]
        });

        // Get Current Player (Explicitly set by Admin)
        let currentPlayer = null;
        if (auction.current_player_id) {
            currentPlayer = await Player.findByPk(auction.current_player_id);
        }

        // Live Bid Data (Stored in Auction Table)
        const currentBid = auction.current_bid_amount || (currentPlayer ? (currentPlayer.base_price || 0) : 0);

        let currentBidder = null;
        if (auction.current_bidder_id) {
            currentBidder = await Team.findByPk(auction.current_bidder_id, {
                attributes: ['id', 'name', 'short_name', 'image_path']
            });
        }

        res.json({
            auction: {
                name: auction.name,
                status: auction.status,
                min_bid: auction.min_bid
            },
            currentPlayer,
            currentBid,
            currentBidder,
            lastSold
        });

    } catch (error) {
        console.error("Error fetching live data:", error);
        res.status(500).json({ message: "Spectator View Error" });
    }
};

// Update Current Player (Spectator Sync)
// Update Current Player (Spectator Sync)
exports.updateCurrentPlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { playerId } = req.body; // Can be null to clear

        // Reset bid when changing player
        await Auction.update({
            current_player_id: playerId,
            current_bid_amount: 0,
            current_bidder_id: null
        }, { where: { id } });

        res.json({ message: 'Current player updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating current player' });
    }
};

// Update Live Bid (Spectator Sync)
exports.updateLiveBid = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, bidderId } = req.body;

        await Auction.update({
            current_bid_amount: amount,
            current_bidder_id: bidderId
        }, { where: { id } });

        res.json({ message: 'Live bid updated' });
    } catch (error) {
        console.error("Bid Sync Error", error);
        res.status(500).json({ message: 'Error updating live bid' });
    }
};
