const { Team, Player, Auction, AuctionPlayer, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAuctionAnalytics = async (req, res) => {
    try {
        console.log("Fetching Analytics...");
        const { auction_id } = req.query;
        const filter = auction_id ? { auction_id } : {};

        // 1. Budget Stats via AuctionPlayer
        const teams = await Team.findAll({
            where: filter,
            attributes: ['id', 'name', 'purse_remaining', 'short_name', 'image_path'],
            include: [{
                model: AuctionPlayer,
                // as: 'SoldPlayers', // Remove alias if not defined in associations
                where: { status: 'Sold' },
                required: false
            }]
        });

        const budgetStats = teams.map(team => {
            // sold_price is now on AuctionPlayer
            const spent = (team.AuctionPlayers || []).reduce((sum, ap) => sum + (ap.sold_price || 0), 0);
            return {
                id: team.id,
                name: team.short_name || team.name,
                full_name: team.name, // Added full_name for table
                image_path: team.image_path,
                budget: (team.purse_remaining || 0) + spent,
                spent: spent,
                remaining: team.purse_remaining,
                playerCount: (team.AuctionPlayers || []).length
            };
        });

        // 2. Role Distribution via AuctionPlayer -> Player
        // We need to count roles of players in THIS auction
        const roleStatsCount = await AuctionPlayer.findAll({
            where: filter,
            include: [{ model: Player, attributes: ['role'] }],
            raw: true
        });

        // Manual Grouping since Player.role is nested
        const roleCounts = {};
        roleStatsCount.forEach(ap => {
            const r = ap['Player.role']; // flat key from raw:true
            if (r) {
                roleCounts[r] = (roleCounts[r] || 0) + 1;
            }
        });

        const roleStats = Object.keys(roleCounts).map(role => ({
            role,
            count: roleCounts[role]
        }));


        // 3. Status Distribution via AuctionPlayer
        const statusStats = await AuctionPlayer.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: filter,
            group: ['status']
        });

        res.json({
            budgetStats,
            roleStats,
            statusStats
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Error fetching analytics" });
    }
};
