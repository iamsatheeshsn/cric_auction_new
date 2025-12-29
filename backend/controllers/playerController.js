const { Player, Team } = require('../models');
const { Op } = require('sequelize');

// Add Player
exports.createPlayer = async (req, res) => {
    try {
        const imagePath = (req.files && req.files['image']) ? req.files['image'][0].path : null;
        const screenshotPath = (req.files && req.files['payment_screenshot']) ? req.files['payment_screenshot'][0].path : null;

        const {
            auction_id, name, father_name, mobile_number, dob, role,
            batting_type, bowling_type, tshirt_size, trouser_size,
            notes, payment_transaction_id, is_owner, points,
            jersey_no, player_link, team_id
        } = req.body;

        // Calculate new order_id (PID)
        const maxOrder = await Player.max('order_id', { where: { auction_id } }) || 0;
        const newOrderId = maxOrder + 1;

        const newPlayer = await Player.create({
            auction_id, name, father_name, mobile_number,
            dob: dob || null,
            role,
            batting_type, bowling_type, tshirt_size, trouser_size,
            notes, payment_transaction_id, is_owner: is_owner === 'true', // FormData sends strings
            points: points || 0,
            jersey_no, player_link,
            image_path: imagePath,
            payment_screenshot_path: screenshotPath,
            team_id: (team_id && team_id !== '') ? team_id : null, // Optional initial assignment
            status: (team_id && team_id !== '') ? 'Sold' : 'Available',
            order_id: newOrderId
        });

        res.status(201).json(newPlayer);
    } catch (error) {
        console.error("Error creating player:", error);
        res.status(500).json({ message: 'Error creating player', error: error.message });
    }
};

// Get Players by Auction
exports.getPlayersByAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const role = req.query.role || '';
        const status = req.query.status || '';

        const whereClause = { auction_id: auctionId };

        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }
        if (role) {
            whereClause.role = role;
        }
        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await Player.findAndCountAll({
            where: whereClause,
            include: [{ model: Team, as: 'Team', attributes: ['name', 'short_name'] }],
            limit,
            offset,
            order: [['order_id', 'ASC'], ['id', 'ASC']],
            subQuery: false // Safe for BelongsTo association to ensure correct ordering
        });




        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            players: rows
        });
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ message: 'Error fetching players' });
    }
};

// Update Player
exports.updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const imagePath = (req.files && req.files['image']) ? req.files['image'][0].path : undefined;
        const screenshotPath = (req.files && req.files['payment_screenshot']) ? req.files['payment_screenshot'][0].path : undefined;

        const player = await Player.findByPk(id);
        if (!player) return res.status(404).json({ message: 'Player not found' });

        const fields = [
            'name', 'father_name', 'mobile_number', 'dob', 'role',
            'batting_type', 'bowling_type', 'tshirt_size', 'trouser_size',
            'notes', 'payment_transaction_id', 'is_owner', 'points',
            'jersey_no', 'player_link', 'team_id'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                let value = req.body[field];
                // Sanitize empty strings for non-string types
                if (value === '' && (field === 'dob' || field === 'team_id' || field === 'points')) {
                    value = null;
                }
                player[field] = value;
            }
        });

        if (imagePath) player.image_path = imagePath;
        if (screenshotPath) player.payment_screenshot_path = screenshotPath;

        // Auto update status if team assigned
        if (req.body.team_id && req.body.team_id !== 'null' && req.body.team_id !== '') {
            player.status = 'Sold';
        }

        await player.save();
        res.json(player);
    } catch (error) {
        console.error("Error updating player:", error);
        res.status(500).json({ message: 'Error updating player', error: error.message });
    }
};

// Mark Player as Sold
exports.markSold = async (req, res) => {
    try {
        const { id } = req.params;
        const { team_id, sod_price } = req.body; // sod_price = final bid amount

        const player = await Player.findByPk(id);
        const team = await Team.findByPk(team_id);

        if (!player || !team) {
            return res.status(404).json({ message: 'Player or Team not found' });
        }

        if (player.status === 'Sold') {
            return res.status(400).json({ message: 'Player is already sold' });
        }

        // 1. Check Player Count Limit
        const currentPlayerCount = await Player.count({ where: { team_id } });
        if (currentPlayerCount >= team.players_per_team) {
            return res.status(400).json({ message: `Team full! Max ${team.players_per_team} players allowed.` });
        }

        // 2. Check Purse Limit
        if (team.purse_remaining < sod_price) {
            return res.status(400).json({ message: `Insufficient purse! Remaining: ${team.purse_remaining}` });
        }

        // Update Team Purse
        team.purse_remaining -= sod_price;
        await team.save();

        // Update Player Status
        player.status = 'Sold';
        player.team_id = team_id;
        player.sold_price = sod_price;
        await player.save();

        res.json({ message: 'Player Sold!', player, team });
    } catch (error) {
        console.error("Error selling player:", error);
        res.status(500).json({ message: 'Error processing sale' });
    }
};

// Mark Player as Unsold
exports.markUnsold = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await Player.findByPk(id);

        if (!player) return res.status(404).json({ message: 'Player not found' });

        player.status = 'Unsold';
        await player.save();

        res.json({ message: 'Player marked Unsold', player });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

// Delete Player
exports.deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        await Player.destroy({ where: { id } });
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting player' });
    }
};

// Revisit Unsold Player (Bring back to Auction)
exports.revisitPlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await Player.findByPk(id);

        if (!player) return res.status(404).json({ message: 'Player not found' });

        if (player.status !== 'Unsold') {
            return res.status(400).json({ message: 'Player is not in Unsold status' });
        }

        player.status = 'Available'; // Reset to Available/Upcoming
        await player.save();

        res.json({ message: 'Player returned to auction pool', player });
    } catch (error) {
        console.error("Error revisiting player:", error);
        res.status(500).json({ message: 'Error updating player status' });
    }
};
// Regenerate Player PIDs (Order IDs)
exports.regeneratePlayerIds = async (req, res) => {
    try {
        const { auctionId } = req.body;
        const players = await Player.findAll({
            where: { auction_id: auctionId },
            order: [['id', 'ASC']]
        });

        for (let i = 0; i < players.length; i++) {
            players[i].order_id = i + 1;
            await players[i].save();
        }

        res.json({ message: 'Player PIDs regenerated successfully' });
    } catch (error) {
        console.error("Error regenerating PIDs:", error);
        res.status(500).json({ message: 'Error regenerating PIDs' });
    }
};
