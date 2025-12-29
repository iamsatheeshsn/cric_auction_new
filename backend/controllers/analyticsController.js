const { Team, Player, Auction, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAuctionAnalytics = async (req, res) => {
    try {
        console.log("Fetching Analytics...");

        // 1. Budget Utilization by Team
        // Fetch specific fields from Teams: Name, Budget, and sum of sold players
        // We can do this via Sequelize inclusions or raw query for speed/ease
        const { auction_id } = req.query;
        const filter = auction_id ? { auction_id } : {};

        const teams = await Team.findAll({
            where: filter,
            attributes: ['id', 'name', 'purse_remaining', 'short_name', 'image_path'],
            include: [{
                model: Player,
                as: 'Players',
                attributes: ['sold_price', 'status', 'role'],
                where: { status: 'Sold' },
                required: false
            }]
        });

        const budgetStats = teams.map(team => {
            const spent = team.Players.reduce((sum, p) => sum + (p.sold_price || 0), 0);
            return {
                id: team.id,
                name: team.short_name || team.name,
                full_name: team.name,
                image_path: team.image_path,
                budget: (team.purse_remaining || 0) + spent, // Total Budget = Remaining + Spent
                spent: spent,
                remaining: team.purse_remaining, // Use DB value directly
                playerCount: team.Players.length
            };
        });

        // 2. Role Distribution (Aggregate)
        const roleStats = await Player.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                role: { [Op.ne]: null },
                ...filter
            },
            group: ['role']
        });

        // 3. Status Distribution
        const statusStats = await Player.findAll({
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
