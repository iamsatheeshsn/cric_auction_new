const { Auction, Team, Player, AuctionPlayer, ScoreBall, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getPastTournaments = async (req, res) => {
    try {
        const auctions = await Auction.findAll({
            where: { status: 'Completed' },
            order: [['auction_date', 'DESC']]
        });

        const detailedAuctions = await Promise.all(auctions.map(async (a) => {
            let winner = null;
            let runnerUp = null;
            let mos = null;

            try {
                if (a.winner_team_id) winner = await Team.findByPk(a.winner_team_id);
                if (a.runner_up_team_id) runnerUp = await Team.findByPk(a.runner_up_team_id);
                if (a.man_of_the_series_id) mos = await Player.findByPk(a.man_of_the_series_id);
            } catch (err) {
                console.warn("Error fetching details for auction " + a.id, err.message);
            }

            return {
                ...a.toJSON(),
                Winner: winner,
                RunnerUp: runnerUp,
                ManOfTheSeries: mos
            };
        }));

        res.json(detailedAuctions);
    } catch (error) {
        console.error("Error fetching tournament history:", error);
        res.status(500).json({ message: "Error fetching history" });
    }
};

exports.getHallOfFame = async (req, res) => {
    try {
        // 1. Most Expensive Player
        const mostExpensive = await AuctionPlayer.findOne({
            order: [['sold_price', 'DESC']],
            include: [
                { model: Player },
                { model: Team },
                { model: Auction } // To know which season
            ]
        });

        // 2. Top Run Scorer (All Time)
        const topRunScorer = await ScoreBall.findAll({
            attributes: [
                'striker_id',
                [sequelize.fn('SUM', sequelize.col('runs_scored')), 'total_runs']
            ],
            group: ['striker_id'],
            order: [[sequelize.literal('total_runs'), 'DESC']],
            limit: 1,
            include: [{ model: Player, as: 'Striker' }]
        });

        // 3. Top Wicket Taker (All Time)
        const topWicketTaker = await ScoreBall.findAll({
            attributes: [
                'bowler_id',
                [sequelize.literal("COUNT(CASE WHEN is_wicket = 1 AND wicket_type != 'Run Out' THEN 1 ELSE NULL END)"), 'total_wickets']
            ],
            where: { bowler_id: { [Op.ne]: null } },
            group: ['bowler_id'],
            order: [[sequelize.literal('total_wickets'), 'DESC']],
            limit: 1,
            include: [{ model: Player, as: 'Bowler' }]
        });

        res.json({
            mostExpensive: mostExpensive ? {
                player: mostExpensive.Player,
                price: mostExpensive.sold_price,
                team: mostExpensive.Team,
                auction: mostExpensive.Auction
            } : null,
            topBatsman: topRunScorer.length > 0 ? {
                player: topRunScorer[0].Striker,
                runs: topRunScorer[0].dataValues.total_runs
            } : null,
            topBowler: topWicketTaker.length > 0 ? {
                player: topWicketTaker[0].Bowler,
                wickets: topWicketTaker[0].dataValues.total_wickets
            } : null
        });

    } catch (error) {
        console.error("Hall of Fame Error:", error);
        res.status(500).json({ message: "Error fetching Hall of Fame" });
    }
};

exports.getPlayerCareer = async (req, res) => {
    try {
        const { playerId } = req.params;

        // Basic Stats
        const player = await Player.findByPk(playerId);
        if (!player) return res.status(404).json({ message: 'Player not found' });

        // Total Runs
        const totalRuns = await ScoreBall.sum('runs_scored', { where: { striker_id: playerId } });

        // Total Wickets
        const totalWickets = await ScoreBall.count({
            where: {
                bowler_id: playerId,
                is_wicket: true,
                wicket_type: { [Op.ne]: 'Run Out' }
            }
        });

        // Auctions Participated
        const participations = await AuctionPlayer.findAll({
            where: { player_id: playerId },
            include: [{ model: Auction }, { model: Team }]
        });

        res.json({
            player,
            stats: {
                runs: totalRuns || 0,
                wickets: totalWickets || 0
            },
            history: participations
        });

    } catch (error) {
        console.error("Player Career Error:", error);
        res.status(500).json({ message: "Error fetch player career" });
    }
};
