const { Player, Team, ScoreBall, sequelize } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');
const fs = require('fs');
const csv = require('csv-parser');
const { createNotification } = require('./notificationController');

// Add Player (Global + Assign to Auction)
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

        const { AuctionPlayer, Player } = require('../models'); // Import locally to ensure init

        // 1. Create or Find Global Player (Simplification: Always create new for now to avoid complexity of matching logic without unique email/phone constraint enforcement upfront)
        // Ideally: const player = await Player.findOne({ where: { mobile_number } });
        const player = await Player.create({
            name, father_name, mobile_number,
            dob: dob || null,
            role,
            batting_type, bowling_type, tshirt_size, trouser_size,
            notes, payment_transaction_id,
            preferred_jersey_no: jersey_no, player_link,
            image_path: imagePath,
            payment_screenshot_path: screenshotPath
        });

        // 2. Link to Auction via AuctionPlayer (IF auction_id provided)
        if (auction_id) {
            const maxOrder = await AuctionPlayer.max('order_id', { where: { auction_id } }) || 0;
            const newOrderId = maxOrder + 1;

            const auctionPlayer = await AuctionPlayer.create({
                auction_id,
                player_id: player.id,
                team_id: (team_id && team_id !== '') ? team_id : null,
                order_id: newOrderId,
                status: (team_id && team_id !== '') ? 'Sold' : 'Available',
                points: points || 0,
                is_owner: is_owner === 'true' ? 'true' : 'false'
            });

            res.status(201).json({ ...player.toJSON(), ...auctionPlayer.toJSON(), id: player.id, order_id: newOrderId });
        } else {
            // Global Player Only Created
            res.status(201).json(player);
        }

        // Notification
        const io = req.app.get('io');
        await createNotification(null, 'INFO', `New Player Added: ${name}`, `/players`, io);

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

        const { AuctionPlayer, Player, Team, sequelize } = require('../models');

        // Build Where Clause for AuctionPlayer (Status, Auction ID)
        const apWhere = { auction_id: auctionId };
        if (status) apWhere.status = status;

        // Build Where Clause for Player (Name, Role)
        const playerWhere = {};
        if (role) playerWhere.role = role;
        if (search) playerWhere.name = { [Op.like]: `%${search}%` };

        // Fetch using Junction Table as primary source for this context
        const { count, rows } = await AuctionPlayer.findAndCountAll({
            where: apWhere,
            include: [
                {
                    model: Player,
                    where: playerWhere, // Filter by global player attributes
                    required: true
                },
                {
                    model: Team,
                    attributes: ['id', 'name', 'short_name']
                }
            ],
            limit,
            offset,
            order: [['order_id', 'ASC']]
        });

        // Fetch Notes separately if user is logged in (to avoid complex include logic if not needed)
        // Create a fixture filter based on the auction
        const playerIds = rows.map(ap => ap.player_id);
        const notesMap = {};
        const { ScoutingNote } = require('../models');

        if (req.user && req.user.id) {
            const notes = await ScoutingNote.findAll({
                where: {
                    user_id: req.user.id,
                    player_id: { [Op.in]: playerIds }
                }
            });
            notes.forEach(n => {
                notesMap[n.player_id] = n.note;
            });
        }

        // Create a fixture filter based on the auction
        const { Fixture } = require('../models');
        const auctionFixtures = await Fixture.findAll({
            where: { auction_id: auctionId },
            attributes: ['id']
        });
        const fixtureIds = auctionFixtures.map(f => f.id);

        // Common stats filter
        const statsFilter = {
            fixture_id: { [Op.in]: fixtureIds }
        };

        // Backend "DTO" mapping to flatten the structure for Frontend compatibility
        const players = await Promise.all(rows.map(async ap => {
            const p = ap.Player;

            // Simplified Career Stats (Filtered by Auction)
            const { ScoreBall } = require('../models');

            const matches = await ScoreBall.count({
                distinct: true,
                col: 'fixture_id',
                where: {
                    [Op.or]: [{ striker_id: p.id }, { bowler_id: p.id }],
                    ...statsFilter
                }
            });

            const runs = await ScoreBall.sum('runs_scored', {
                where: { striker_id: p.id, ...statsFilter }
            }) || 0;

            const wickets = await ScoreBall.count({
                where: {
                    bowler_id: p.id,
                    is_wicket: true,
                    wicket_type: { [Op.ne]: 'Run Out' },
                    ...statsFilter
                }
            });

            const balls_faced = await ScoreBall.count({
                where: {
                    striker_id: p.id,
                    extra_type: { [Op.ne]: 'Wide' },
                    ...statsFilter
                }
            });

            const outs = await ScoreBall.count({
                where: { player_out_id: p.id, ...statsFilter }
            });

            const balls_bowled = await ScoreBall.count({
                where: {
                    bowler_id: p.id,
                    extra_type: { [Op.and]: [{ [Op.ne]: 'Wide' }, { [Op.ne]: 'NoBall' }] },
                    ...statsFilter
                }
            });

            // runs_conceded calculation (complex literal query needs filter injection)
            const rc_result = await ScoreBall.findAll({
                attributes: [[sequelize.literal('SUM(runs_scored + extras)'), 'total']],
                where: {
                    bowler_id: p.id,
                    ...statsFilter
                }
            });
            const runs_conceded_final = rc_result[0]?.dataValues.total || 0;

            return {
                // IDs
                id: p.id, // Global Player ID
                auction_player_id: ap.id, // Junction ID (needed for updates)
                auction_id: ap.auction_id,

                // PID / Order
                order_id: ap.order_id,

                // Status & Auction Info
                status: ap.status,
                sold_price: ap.sold_price,
                points: ap.points,
                is_owner: ap.is_owner === 'true',

                // Team
                team_id: ap.team_id,
                Team: ap.Team, // Include nested Team object

                // Personal Info (from Global Player or Auction Override)
                name: p.name,
                role: p.role,
                // PRIORITIZE Auction Specific Image
                image_path: ap.image_path || p.image_path,
                mobile_number: p.mobile_number,
                father_name: p.father_name,
                dob: p.dob,
                batting_type: p.batting_type,
                bowling_type: p.bowling_type,
                tshirt_size: p.tshirt_size,
                trouser_size: p.trouser_size,
                notes: ap.notes || p.notes, // PRIORITIZE Auction Notes
                my_note: notesMap[p.id] || null, // Private Scouting Note
                player_link: p.player_link,
                jersey_no: p.preferred_jersey_no,

                // Stats
                stats: {
                    matches,
                    runs,
                    wickets,
                    balls_faced,
                    outs,
                    balls_bowled,
                    runs_conceded: runs_conceded_final
                },

                // Timestamps
                createdAt: ap.createdAt,
                updatedAt: ap.updatedAt
            };
        }));

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            players: players
        });
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ message: 'Error fetching players', error: error.message });
    }
};

// Get All Global Players (No Auction Filter)
exports.getAllPlayers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const role = req.query.role || '';

        const whereClause = {};
        if (search) whereClause.name = { [Op.like]: `%${search}%` };
        if (role) whereClause.role = role;

        const { count, rows } = await Player.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const players = await Promise.all(rows.map(async p => {
            // Simplified Career Stats
            const matches = await ScoreBall.count({
                distinct: true,
                col: 'fixture_id',
                where: {
                    [Op.or]: [{ striker_id: p.id }, { bowler_id: p.id }]
                }
            });

            const runs = await ScoreBall.sum('runs_scored', { where: { striker_id: p.id } }) || 0;
            const balls_faced = await ScoreBall.count({
                where: { striker_id: p.id, extra_type: { [Op.ne]: 'Wide' } }
            });
            const outs = await ScoreBall.count({ where: { player_out_id: p.id } });

            const wickets = await ScoreBall.count({
                where: {
                    bowler_id: p.id,
                    is_wicket: true,
                    wicket_type: { [Op.ne]: 'Run Out' }
                }
            });
            const balls_bowled = await ScoreBall.count({
                where: { bowler_id: p.id, extra_type: { [Op.and]: [{ [Op.ne]: 'Wide' }, { [Op.ne]: 'NoBall' }] } }
            });
            const rc_result = await ScoreBall.findAll({
                attributes: [[sequelize.literal('SUM(runs_scored + extras)'), 'total']],
                where: { bowler_id: p.id }
            });
            const runs_conceded = rc_result[0]?.dataValues.total || 0;

            // Fetch private note if user is logged in
            let my_note = null;
            if (req.user && req.user.id) {
                // Optimization: Fetch all notes upfront instead of N+1? 
                // Since this is getAllPlayers with pagination, N is small (20).
                // But doing it inside the loop is definitely N+1 queries.
                // Optimizing: Let's follow the pattern in getPlayersByAuction - fetch outside loop.
                // However, refactoring the whole function to map pattern is risky for now.
                // Let's just do single query here for now as simpler fix, or fetch map outside loop.
            }

            return {
                ...p.toJSON(),
                my_note: null, // Placeholder, see logic below
                stats: {
                    matches,
                    runs,
                    wickets,
                    balls_faced,
                    outs,
                    balls_bowled,
                    runs_conceded
                }
            };
        }));

        // OPTIMIZATION: Fetch notes for all players in current page
        if (req.user && req.user.id && players.length > 0) {
            const { ScoutingNote } = require('../models');
            const playerIds = players.map(p => p.id);
            const notes = await ScoutingNote.findAll({
                where: {
                    user_id: req.user.id,
                    player_id: { [Op.in]: playerIds }
                }
            });

            const notesMap = {};
            notes.forEach(n => { notesMap[n.player_id] = n.note; });

            // Attach to players
            players.forEach(p => {
                p.my_note = notesMap[p.id] || null;
            });
        }

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            players: players
        });
    } catch (error) {
        console.error("Error fetching global players:", error);
        res.status(500).json({ message: 'Error fetching global players', error: error.message });
    }
};

// Update Player (Global & Auction Specific)
exports.updatePlayer = async (req, res) => {
    try {
        const { id } = req.params; // Global Player ID
        const imagePath = (req.files && req.files['image']) ? req.files['image'][0].path : undefined;
        const screenshotPath = (req.files && req.files['payment_screenshot']) ? req.files['payment_screenshot'][0].path : undefined;
        const { auction_id } = req.body; // Context is important

        // 1. Update Global Player
        const { AuctionPlayer, Player, Team } = require('../models');
        const player = await Player.findByPk(id);

        if (!player) return res.status(404).json({ message: 'Player not found' });

        const globalFields = [
            'name', 'father_name', 'mobile_number', 'dob', 'role',
            'batting_type', 'bowling_type', 'tshirt_size', 'trouser_size',
            'notes', 'payment_transaction_id',
            'jersey_no', 'player_link'
        ];

        globalFields.forEach(field => {
            if (req.body[field] !== undefined) {
                let value = req.body[field];
                player[field] = value === '' ? null : value;
            }
        });

        if (imagePath && !auction_id) player.image_path = imagePath; // Update global only if not auction specific context (or we can decide policy)
        // Policy: If editing in Global view -> Update Global. If editing in Auction view -> Update Auction Specific.
        // But the UI sends auction_id if inside auction.

        if (screenshotPath) player.payment_screenshot_path = screenshotPath;
        if (req.body.jersey_no) player.preferred_jersey_no = req.body.jersey_no;

        await player.save();

        // 2. Update AuctionPlayer (if auction_id is present)
        if (auction_id) {
            const auctionPlayer = await AuctionPlayer.findOne({
                where: { player_id: id, auction_id }
            });

            if (auctionPlayer) {
                if (req.body.is_owner !== undefined) auctionPlayer.is_owner = req.body.is_owner;
                if (req.body.points !== undefined) auctionPlayer.points = req.body.points;

                // Save Auction Specific Image
                if (imagePath) {
                    auctionPlayer.image_path = imagePath;
                }

                if (req.body.team_id !== undefined) {
                    // Check if clearing team
                    if (req.body.team_id === '' || req.body.team_id === 'null' || req.body.team_id === null) {
                        auctionPlayer.team_id = null;
                        auctionPlayer.status = 'Available';
                    } else {
                        auctionPlayer.team_id = req.body.team_id;
                        auctionPlayer.status = 'Sold';
                    }
                }
                await auctionPlayer.save();
            }
        }


        const io = req.app.get('io');
        // If critical update (like team change), notify
        if (auction_id && req.body.team_id && req.body.team_id !== '' && req.body.team_id !== 'null') {
            await createNotification(null, 'SUCCESS', `Player ${player.name} transferred to a new team!`, `/players`, io);
        } else {
            await createNotification(null, 'INFO', `Player Updated: ${player.name}`, `/players`, io);
        }

        if (req.body.userId) {
            await logActivity(req.body.userId, "Updated Player", `Updated player '${player.name}'`, 'Player', player.id);
        }

        res.json(player);
    } catch (error) {
        console.error("Error updating player:", error);
        res.status(500).json({ message: 'Error updating player', error: error.message });
    }
};

// Get Unregistered Players for an Auction
exports.getUnregisteredPlayers = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const search = req.query.search || '';

        const { AuctionPlayer, Player } = require('../models');

        // 1. Get IDs of players ALREADY in this auction
        const registeredPlayers = await AuctionPlayer.findAll({
            where: { auction_id: auctionId },
            attributes: ['player_id']
        });
        const registeredIds = registeredPlayers.map(ap => ap.player_id);

        // 2. Find Global Players NOT in that list
        const whereClause = {
            id: { [Op.notIn]: registeredIds }
        };

        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        // Limit results for performance (e.g., top 50 matches)
        const unregisteredPlayers = await Player.findAll({
            where: whereClause,
            limit: 50,
            order: [['name', 'ASC']]
        });

        res.json(unregisteredPlayers);
    } catch (error) {
        console.error("Error fetching unregistered:", error);
        res.status(500).json({ message: 'Error fetching players' });
    }
};

// Register Player to Auction
exports.registerPlayer = async (req, res) => {
    try {
        const { auction_id, player_id, points } = req.body;
        const { AuctionPlayer } = require('../models');

        // Check if already registered
        const existing = await AuctionPlayer.findOne({
            where: { auction_id, player_id }
        });

        if (existing) {
            return res.status(400).json({ message: 'Player already registered in this auction' });
        }

        // Calculate Next Order ID
        const maxOrder = await AuctionPlayer.max('order_id', { where: { auction_id } }) || 0;
        const newOrderId = maxOrder + 1;

        const newEntry = await AuctionPlayer.create({
            auction_id,
            player_id,
            order_id: newOrderId,
            points: points || 0, // Base Price
            status: 'Available',
            is_owner: 'false'
        });

        res.status(201).json(newEntry);
    } catch (error) {
        console.error("Error registering player:", error);
        res.status(500).json({ message: 'Error registering player' });
    }
};

// Mark Player as Sold
exports.markSold = async (req, res) => {
    try {
        const { id } = req.params; // Global Player ID
        const { team_id, sod_price } = req.body; // sod_price = final bid amount
        const { AuctionPlayer, Player, Team, Auction } = require('../models');

        const team = await Team.findByPk(team_id, {
            include: [{ model: Auction }]
        });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const auction = team.Auction;
        // Use Auction Limit or Team Limit (if distinct), defaulting to Auction rule
        const maxSquadSize = auction.max_squad_size || team.players_per_team || 25;

        // Find AuctionPlayer for this player and this team's auction
        const auctionPlayer = await AuctionPlayer.findOne({
            where: { player_id: id, auction_id: team.auction_id }
        });

        if (!auctionPlayer) {
            return res.status(404).json({ message: 'Player not registered for this auction' });
        }

        if (auctionPlayer.status === 'Sold') {
            return res.status(400).json({ message: 'Player is already sold' });
        }

        // 1. Check Player Count Limit
        // Count how many players this team has in this auction
        const currentPlayerCount = await AuctionPlayer.count({ where: { team_id, auction_id: team.auction_id } });

        if (currentPlayerCount >= maxSquadSize) {
            return res.status(400).json({ message: `Team full! Max ${maxSquadSize} players allowed.` });
        }

        // 2. Check Purse Limit
        if (team.purse_remaining < sod_price) {
            return res.status(400).json({ message: `Insufficient purse! Remaining: ${team.purse_remaining}` });
        }

        // Update Team Purse
        team.purse_remaining -= sod_price;
        await team.save();

        // Update AuctionPlayer Status
        auctionPlayer.status = 'Sold';
        auctionPlayer.team_id = team_id;
        auctionPlayer.sold_price = sod_price;
        await auctionPlayer.save();

        const io = req.app.get('io');
        await createNotification(null, 'SUCCESS', `SOLD! ${auctionPlayer.Player?.name || 'Player'} sold to ${team.name} for ₹${sod_price}!`, `/auction-room/${team.auction_id}`, io);

        res.json({ message: 'Player Sold!', player: auctionPlayer, team });
    } catch (error) {
        console.error("Error selling player:", error);
        res.status(500).json({ message: 'Error processing sale' });
    }
};

// Mark Player as Unsold
exports.markUnsold = async (req, res) => {
    try {
        const { id } = req.params; // Global Player ID
        const { auction_id } = req.body;
        const { AuctionPlayer } = require('../models');

        if (!auction_id) {
            return res.status(400).json({ message: 'Auction ID is required' });
        }

        const auctionPlayer = await AuctionPlayer.findOne({
            where: { player_id: id, auction_id }
        });

        if (!auctionPlayer) return res.status(404).json({ message: 'Player not found in this auction' });

        auctionPlayer.status = 'Unsold';
        await auctionPlayer.save();

        await auctionPlayer.save();

        const io = req.app.get('io');
        await createNotification(null, 'WARNING', `UNSOLD! Player marked as unsold.`, `/auction-room/${auction_id}`, io);

        res.json({ message: 'Player marked as Unsold' });
    } catch (error) {
        console.error("Error marking unsold:", error);
        res.status(500).json({ message: 'Error marking unsold' });
    }
};

// Delete Player (Remove from Auction)
exports.deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { AuctionPlayer, Watchlist } = require('../models');

        // 1. Remove from Watchlists
        await Watchlist.destroy({ where: { player_id: id } });

        // 2. Remove from AuctionPlayer (current & history)
        await AuctionPlayer.destroy({ where: { player_id: id } });

        // 3. Finally Delete Global Player
        await Player.destroy({ where: { id } });

        const io = req.app.get('io');
        await createNotification(null, 'WARNING', `Player ID ${id} deleted.`, `/players`, io);

        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error("Error deleting player:", error);
        res.status(500).json({ message: 'Error deleting player', error: error.message });
    }
};

// Revisit Unsold Player (Bring back to Auction)
exports.revisitPlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { auction_id } = req.body;
        const { AuctionPlayer } = require('../models');

        if (!auction_id) {
            return res.status(400).json({ message: 'Auction ID is required' });
        }

        const auctionPlayer = await AuctionPlayer.findOne({
            where: { player_id: id, auction_id }
        });

        if (!auctionPlayer) {
            console.log(`Revisit: AuctionPlayer not found for pID=${id} aID=${auction_id}`);
            return res.status(404).json({ message: 'Player not found in this auction' });
        }

        console.log(`Revisit: Found AP status: '${auctionPlayer.status}'`);

        if (auctionPlayer.status !== 'Unsold') {
            return res.status(400).json({ message: `Player is not in Unsold status (Current: ${auctionPlayer.status})` });
        }

        auctionPlayer.status = 'Available'; // Reset to Available/Upcoming
        await auctionPlayer.save();

        res.json({ message: 'Player returned to auction pool', player: auctionPlayer });
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

// Bulk Import Players
// Bulk Import Players
exports.createPlayersBulk = async (req, res) => {
    console.log("Bulk Import Request Received");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    try {
        if (!req.file) {
            console.error("No file in request");
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { auction_id } = req.body;
        const results = [];
        // Debug Logging Function
        const logDebug = (msg) => {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../import_debug.log');
            const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
            console.log(msg);
            try {
                fs.appendFileSync(logPath, logMsg);
            } catch (e) { console.error("Log write failed", e); }
        };

        logDebug("--- NEW IMPORT REQUEST ---");
        logDebug(`File: ${req.file.path} (${req.file.size} bytes)`);

        // Wrap stream processing in a Promise to handle async behavior correctly
        const processFile = new Promise((resolve, reject) => {
            const stream = fs.createReadStream(req.file.path)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ''), // Remove BOM and trim
                    mapValues: ({ value }) => value ? value.trim() : value
                }))
                .on('data', (data) => results.push(data))
                .on('error', (err) => reject(err))
                .on('end', () => resolve(results));
        });

        await processFile;

        logDebug(`Parsed Rows: ${results.length}`);
        let firstRowKeys = [];
        if (results.length > 0) {
            firstRowKeys = Object.keys(results[0]);
            logDebug(`First Row Keys: ${JSON.stringify(firstRowKeys)}`);
            logDebug(`First Row Data: ${JSON.stringify(results[0])}`);
        }

        let importedCount = 0;
        let currentMaxOrder = 0;
        if (auction_id) {
            currentMaxOrder = await AuctionPlayer.max('order_id', { where: { auction_id } }) || 0;
        }

        for (const row of results) {
            try {
                // Check for minimal required fields
                if (!row.name || !row.mobile_number) {
                    console.warn("Skipping row with missing name or mobile:", row);
                    continue;
                }

                const {
                    name, mobile_number, role, batting_type, bowling_type,
                    father_name, dob, tshirt_size, trouser_size, notes,
                    points, jersey_no
                } = row;

                // Create Global Player
                const player = await Player.create({
                    name: name,
                    mobile_number: mobile_number,
                    role: role || 'All Rounder',
                    batting_type: batting_type || 'Right Hand',
                    bowling_type: bowling_type || 'None',
                    father_name: father_name,
                    dob: dob ? new Date(dob) : null,
                    tshirt_size: tshirt_size,
                    trouser_size: trouser_size,
                    notes: notes,
                    preferred_jersey_no: jersey_no,
                    image_path: 'uploads/default_player.png' // Default image to satisfy NOT NULL constraint
                });

                // Link to Auction
                if (auction_id && player) {
                    currentMaxOrder++;
                    await AuctionPlayer.create({
                        auction_id: auction_id,
                        player_id: player.id,
                        order_id: currentMaxOrder,
                        status: 'Available',
                        points: points || 0,
                        is_owner: 'false'
                    });
                }
                importedCount++;
            } catch (err) {
                console.error("Error importing row:", row, err.message);
            }
        }

        // Cleanup uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (importedCount === 0) {
            return res.json({
                message: `Imported 0 players. Found ${results.length} rows. Keys: ${firstRowKeys.join(', ')}`,
                debug: { rowsFound: results.length, keys: firstRowKeys }
            });
        }

        res.json({ message: `Successfully imported ${importedCount} players.` });

    } catch (error) {
        console.error("Error in bulk import:", error);
        // Ensure cleanup on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing bulk import', error: error.message });
    }
};

// Download Sample CSV
exports.downloadSampleCSV = (req, res) => {
    const csvContent = "name,mobile_number,role,batting_type,bowling_type,father_name,dob,tshirt_size,trouser_size,notes,points,jersey_no\n" +
        "Player Name,9999999999,Batsman,Right Hand,None,Father Name,1990-01-01,M,32,Sample Note,100,18";

    res.header('Content-Type', 'text/csv');
    res.attachment('sample_players.csv');
    return res.send(csvContent);
};

// Add/Update Scouting Note
exports.addScoutingNote = async (req, res) => {
    try {
        const { id } = req.params; // Player ID (Global ID)
        const { note } = req.body;
        const userId = req.user.id; // Assumes authMiddleware ensured this

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { ScoutingNote } = require('../models');

        // Upsert Note
        // Use findOne first to avoid unique constraint race condition slightly, or utilize upsert if supported well
        // Sequelize upsert:
        const [scoutingNote, created] = await ScoutingNote.findOrCreate({
            where: { user_id: userId, player_id: id },
            defaults: { note }
        });

        if (!created) {
            scoutingNote.note = note;
            await scoutingNote.save();
        }

        res.json({ message: 'Note saved', note: scoutingNote });
    } catch (error) {
        console.error("Error saving note:", error);
        res.status(500).json({ message: 'Error saving note' });
    }
};

