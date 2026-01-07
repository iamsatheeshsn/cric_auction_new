const { Auction, Team, Player, AuctionPlayer, Bid } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');
const { logActivity } = require('../utils/activityLogger');

// Create Auction
exports.createAuction = async (req, res) => {
    try {
        console.log("Create Auction Body:", req.body);
        console.log("Create Auction File:", req.file);

        // Using Multer
        // Normalize path to use forward slashes for URL compatibility
        const imagePath = req.file ? `uploads/${req.file.filename}` : null;

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

        const io = req.app.get('io');
        await createNotification(null, 'INFO', `New Auction Created: ${newAuction.name}`, `/auctions`, io);

        // Log Activity
        if (req.body.userId) {
            await logActivity(req.body.userId, "Created Auction", `Created auction '${name}'`, 'Auction', newAuction.id);
        }

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
        const imagePath = req.file ? `uploads/${req.file.filename}` : undefined;

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

        const io = req.app.get('io');
        await createNotification(null, 'INFO', `Auction Updated: ${auction.name}`, `/auctions`, io);

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

        const io = req.app.get('io');
        await createNotification(null, 'WARNING', `Auction Deleted: ${auction.name}`, `/auctions`, io);

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
            const { AuctionPlayer } = require('../models');

            // 1. Get existing player links in target
            const existingLinks = await AuctionPlayer.findAll({
                where: { auction_id: targetAuctionId },
                attributes: ['player_id'],
                raw: true
            });
            const existingPlayerIds = new Set(existingLinks.map(l => l.player_id));

            // 2. Get source player links
            const sourceLinks = await AuctionPlayer.findAll({
                where: { auction_id: sourceAuctionId },
                raw: true
            });

            if (sourceLinks.length > 0) {
                // Get current max order_id for target auction
                const maxOrder = await AuctionPlayer.max('order_id', { where: { auction_id: targetAuctionId } }) || 0;
                let nextOrder = maxOrder + 1;

                // 3. Filter out duplicates
                const newLinks = sourceLinks
                    .filter(link => !existingPlayerIds.has(link.player_id))
                    .map(link => ({
                        auction_id: targetAuctionId,
                        player_id: link.player_id,
                        order_id: nextOrder++,
                        points: link.points || 0,
                        status: 'Available', // Reset status for new auction
                        is_owner: 'false',
                        sold_price: 0
                    }));

                if (newLinks.length > 0) {
                    await AuctionPlayer.bulkCreate(newLinks);
                }
                playersCopied = newLinks.length;
                playersSkipped = sourceLinks.length - newLinks.length;
            }
        }


        const io = req.app.get('io');
        await createNotification(null, 'SUCCESS', `Data Import: ${teamsCopied} Teams & ${playersCopied} Players copied to ${targetAuction.name}`, `/auctions`, io);

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

        // Get Last Sold Player via AuctionPlayer
        const { AuctionPlayer } = require('../models');
        const lastSoldEntry = await AuctionPlayer.findOne({
            where: { auction_id: id, status: 'Sold' },
            order: [['updatedAt', 'DESC']],
            include: [
                { model: Player },
                { model: Team }
            ]
        });

        // Transform for frontend expected format if needed, or send as is
        // Transform Last Sold
        const lastSold = lastSoldEntry ? {
            ...lastSoldEntry.Player.toJSON(),
            Team: lastSoldEntry.Team,
            sold_price: lastSoldEntry.sold_price,
            image_path: lastSoldEntry.image_path || lastSoldEntry.Player.image_path // Prioritize Auction Image
        } : null;

        // Get Current Player (Explicitly set by Admin)
        let currentPlayer = null;
        if (auction.current_player_id) {
            const player = await Player.findByPk(auction.current_player_id);
            if (player) {
                // Fetch Auction Specific Details (Image, etc.)
                const auctionPlayer = await AuctionPlayer.findOne({
                    where: { player_id: player.id, auction_id: id }
                });

                currentPlayer = {
                    ...player.toJSON(),
                    image_path: auctionPlayer?.image_path || player.image_path,
                    points: auctionPlayer?.points || player.points || 0
                };
            }
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

        const io = req.app.get('io');
        if (playerId) {
            await createNotification(null, 'INFO', `Auction Live: New player on the block!`, `/auction-room/${id}`, io);
        }

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

        const auction = await Auction.findByPk(id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        await Auction.update({
            current_bid_amount: amount,
            current_bidder_id: bidderId
        }, { where: { id } });

        // Log Bid History
        if (auction.current_player_id && bidderId) {
            // We need to fetch current player from auction or request?
            // Auction model has current_player_id.
            // If this is a valid bid on a player.
            await Bid.create({
                auction_id: id,
                player_id: auction.current_player_id,
                team_id: bidderId,
                amount: amount
            });
        }

        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.emit('bid_updated', {
                auctionId: id,
                amount: amount,
                bidderId: bidderId,
                timestamp: new Date()
            });
        }

        res.json({ message: 'Live bid updated' });
    } catch (error) {
        console.error("Bid Sync Error", error);
        res.status(500).json({ message: 'Error updating live bid' });
    }
};
