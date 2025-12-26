const { Auction, Team, Player, Fixture, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
    try {
        // Parallel data fetching for performance
        const [
            auctionCount,
            teamCount,
            playerCount,
            roleDistribution,
            playerStatus,
            matchStatusCount
        ] = await Promise.all([
            // 1. Total Auctions
            Auction.count(),

            // 2. Total Teams
            Team.count(),

            // 3. Total Players
            Player.count(),

            // 4. Role Distribution
            Player.findAll({
                attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['role']
            }),

            // 5. Player Status Distribution
            Player.findAll({
                attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['status']
            }),

            // 6. Match Status Distribution
            Fixture.findAll({
                attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['status']
            })
        ]);

        // Process Role Distribution for Chart
        const roles = roleDistribution.map(r => ({
            name: r.role || 'Unknown',
            value: parseInt(r.dataValues.count)
        }));

        // Process Match Status
        const matchStats = matchStatusCount.map(r => ({
            name: r.status,
            value: parseInt(r.dataValues.count)
        }));

        // Process Player Status
        const statusDist = playerStatus.reduce((acc, curr) => {
            acc[curr.status] = parseInt(curr.dataValues.count);
            return acc;
        }, {});

        // Recent Auctions (Separate fetch for clarity/limit)
        const recentAuctions = await Auction.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json({
            counts: {
                auctions: auctionCount,
                teams: teamCount,
                players: playerCount
            },
            charts: {
                roles,
                playerStatus: statusDist,
                matchStats
            },
            recentAuctions
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        // detailed error
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
};
