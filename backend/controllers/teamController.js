const { Team, Auction, Player } = require('../models');
const { Op } = require('sequelize');

// Create Team
exports.createTeam = async (req, res) => {
    try {
        const imagePath = req.file ? req.file.path : null;
        const {
            auction_id,
            name,
            short_name,
            players_per_team
        } = req.body;

        const newTeam = await Team.create({
            auction_id,
            name,
            short_name,
            players_per_team,
            image_path: imagePath,
            purse_remaining: 0 // Will be updated later or logic added to fetch from Auction points
        });

        // Fetch auction to get max points and update purse (optional initial logic)
        const auction = await Auction.findByPk(auction_id);
        if (auction) {
            newTeam.purse_remaining = auction.points_per_team;
            await newTeam.save();
        }

        res.status(201).json(newTeam);
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: 'Error creating team', error: error.message });
    }
};

// Get Teams by Auction ID
// Get Teams by Auction ID
// Get Teams by Auction ID
exports.getTeamsByAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const whereClause = { auction_id: auctionId };
        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        const { AuctionPlayer, Player } = require('../models');

        const { count, rows } = await Team.findAndCountAll({
            where: whereClause,
            include: [{
                model: AuctionPlayer,
                // as: 'SoldPlayers', // Optional, if you add alias in index.js
                required: false, // Left join
                where: { status: 'Sold' },
                include: [{
                    model: Player,
                    attributes: ['id', 'name', 'role', 'image_path'] // Select needed fields
                }]
            }],
            // Actually if I put where in include, teams with no sold players might be excluded if I don't set required: false.
            // But required: false with where clause on included model...
            // Better to fetch all associated players and filter in frontend? Or strict filter "Sold".
            // Let's just fetch ALL players associated (if association is set by team_id).
            // Usually players table has team_id.
            // Usually players table has team_id.
            limit,
            offset,
            order: [['name', 'ASC']]
        });

        // Transform headers to match frontend expectation (Team -> Players)
        const teams = rows.map(team => {
            const teamData = team.toJSON();
            if (teamData.AuctionPlayers) {
                teamData.Players = teamData.AuctionPlayers.map(ap => ({
                    ...ap.Player,
                    sold_price: ap.sold_price,
                    image_path: ap.image_path || ap.Player.image_path // Prioritize Auction Image
                }));
                // delete teamData.AuctionPlayers; // Keep it if needed for debug, or delete
            } else {
                teamData.Players = [];
            }
            return teamData;
        });

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            teams: teams
        });
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: 'Error fetching teams' });
    }
};
// Update Team
exports.updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, short_name, players_per_team, purse_remaining } = req.body;
        const imagePath = req.file ? req.file.path : undefined;

        const team = await Team.findByPk(id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        team.name = name || team.name;
        team.short_name = short_name || team.short_name;
        team.players_per_team = players_per_team || team.players_per_team;
        if (purse_remaining) team.purse_remaining = purse_remaining;
        if (imagePath) team.image_path = imagePath;

        await team.save();
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: 'Error updating team' });
    }
};

// Delete Team
exports.deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findByPk(id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        await team.destroy();
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting team' });
    }
};
// Get ALL Teams for Dropdown (No Pagination)
exports.getAllTeams = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const teams = await Team.findAll({
            where: { auction_id: auctionId },
            attributes: ['id', 'name', 'short_name'],
            order: [['name', 'ASC']]
        });
        res.json(teams);
    } catch (error) {
        console.error("Error fetching all teams:", error);
        res.status(500).json({ message: 'Error fetching teams' });
    }
};
// Get Team Wallet Details
exports.getTeamWalletDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { AuctionPlayer, Player } = require('../models');

        const team = await Team.findByPk(id, {
            attributes: ['id', 'name', 'short_name', 'purse_remaining', 'players_per_team', 'image_path']
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Fetch Sold Players
        const soldPlayers = await AuctionPlayer.findAll({
            where: {
                team_id: id,
                status: 'Sold'
            },
            include: [{
                model: Player,
                attributes: ['id', 'name', 'role', 'image_path']
            }],
            order: [['updatedAt', 'DESC']] // Most recent purchase first
        });

        // Calculate Stats
        let totalSpent = 0;
        const roleSplit = {};
        const history = [];

        soldPlayers.forEach(ap => {
            const price = parseFloat(ap.sold_price || 0);
            totalSpent += price;

            const role = ap.Player?.role || 'Unknown';
            if (!roleSplit[role]) roleSplit[role] = 0;
            roleSplit[role] += price;

            history.push({
                player_name: ap.Player?.name || 'Unknown',
                role: role,
                amount: price,
                time: ap.updatedAt
            });
        });

        const totalBudget = parseFloat(team.purse_remaining || 0) + totalSpent;

        res.json({
            team: team,
            summary: {
                total_budget: totalBudget,
                total_spent: totalSpent,
                remaining: team.purse_remaining,
                squad_count: soldPlayers.length,
                total_slots: team.players_per_team
            },
            role_split: roleSplit,
            history: history
        });

    } catch (error) {
        console.error("Error fetching wallet details:", error);
        res.status(500).json({ message: 'Error fetching wallet details' });
    }
};
