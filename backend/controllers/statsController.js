const { ScoreBall, Player, Team, Fixture, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to get stats for a single player
const getPlayerStats = async (playerId) => {
    // 1. Basic Info
    const player = await Player.findByPk(playerId, { include: [{ model: Team }] });
    if (!player) return null;

    // 2. Batting Stats
    const ballsFaced = await ScoreBall.findAll({ where: { striker_id: playerId } });
    const inningsBat = new Set(ballsFaced.map(b => b.fixture_id + '-' + b.innings)).size;
    let runs = 0;
    let balls = 0;
    let fours = 0;
    let sixes = 0;
    let outs = 0; // Approximate

    // check outs where player_out_id is this player
    const wicketBalls = await ScoreBall.count({ where: { player_out_id: playerId } });
    outs = wicketBalls;

    ballsFaced.forEach(b => {
        runs += b.runs_scored;
        if (b.extra_type !== 'Wide') balls++;
        if (b.runs_scored === 4) fours++;
        if (b.runs_scored === 6) sixes++;
    });

    const average = outs > 0 ? (runs / outs).toFixed(2) : runs > 0 ? runs : 0;
    const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : 0;

    // 3. Bowling Stats
    const ballsBowled = await ScoreBall.findAll({ where: { bowler_id: playerId } });
    const inningsBowl = new Set(ballsBowled.map(b => b.fixture_id + '-' + b.innings)).size;
    let runsConceded = 0;
    let wickets = 0;
    let legalBallsBowled = 0;

    ballsBowled.forEach(b => {
        if (b.extra_type !== 'Bye' && b.extra_type !== 'LegBye') runsConceded += b.runs_scored + b.extras;
        if (b.extra_type !== 'Wide' && b.extra_type !== 'NoBall') legalBallsBowled++;
        if (b.is_wicket && b.wicket_type !== 'Run Out') wickets++;
    });

    const overs = Math.floor(legalBallsBowled / 6) + '.' + (legalBallsBowled % 6);
    const econ = legalBallsBowled > 0 ? ((runsConceded / legalBallsBowled) * 6).toFixed(2) : 0;
    const bowlAvg = wickets > 0 ? (runsConceded / wickets).toFixed(2) : 0;

    // 4. Fielding
    const catches = await ScoreBall.count({ where: { fielder_id: playerId, wicket_type: 'Caught' } });
    const runouts = await ScoreBall.count({ where: { fielder_id: playerId, wicket_type: 'Run Out' } });

    // 5. Matches (Unique fixtures appeared in)
    const matchesBat = ballsFaced.map(b => b.fixture_id);
    const matchesBowl = ballsBowled.map(b => b.fixture_id);
    const totalMatches = new Set([...matchesBat, ...matchesBowl]).size;

    return {
        id: player.id,
        name: player.name,
        role: player.role,
        image: player.image_path || player.image, // Fix image path mapping
        team: player.Team?.name || 'Unsold',
        price: player.sold_price || player.base_price,
        matches: totalMatches,

        runs,
        batAvg: average,
        strikeRate: sr,
        fours,
        sixes,
        hs: 0, // Not calculated for speed

        wickets,
        economy: econ,
        bowlAvg,
        bestFig: 'N/A',

        catches,
        catches,
        runouts
    };
};

exports.getComparison = async (req, res) => {
    try {
        const { p1, p2 } = req.query;
        if (!p1 || !p2) return res.status(400).json({ message: "Player IDs required" });

        const s1 = await getPlayerStats(p1);
        const s2 = await getPlayerStats(p2);

        res.json({ p1: s1, p2: s2 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error comparing players" });
    }
};

exports.getLeaderboards = async (req, res) => {
    try {
        console.log("Fetching Leaderboards... Query:", req.query);
        const { auctionId } = req.query;

        // 1. Get relevant Fixture IDs (Filter Scope)
        let fixtureFilter = {};
        if (auctionId) {
            const fixtures = await Fixture.findAll({
                where: { auction_id: auctionId },
                attributes: ['id']
            });
            const fixtureIds = fixtures.map(f => f.id);
            if (fixtureIds.length === 0) {
                // No fixtures, so no stats
                return res.json({ batters: [], bowlers: [], mvp: [] });
            }
            fixtureFilter = { fixture_id: fixtureIds };
        }

        // --- BATTERS (Orange Cap) ---
        // Sum runs_scored for each striker
        const batters = await ScoreBall.findAll({
            attributes: [
                'striker_id',
                [sequelize.fn('SUM', sequelize.col('runs_scored')), 'total_runs'],
                [sequelize.fn('COUNT', sequelize.col('ScoreBall.id')), 'balls_faced'],
                // Count 4s
                [sequelize.literal("SUM(CASE WHEN runs_scored = 4 THEN 1 ELSE 0 END)"), 'fours'],
                // Count 6s
                [sequelize.literal("SUM(CASE WHEN runs_scored = 6 THEN 1 ELSE 0 END)"), 'sixes']
            ],
            where: fixtureFilter,
            group: ['striker_id'],
            order: [[sequelize.literal('total_runs'), 'DESC']],
            limit: 10,
            include: [{
                model: Player,
                as: 'Striker',
                attributes: ['id', 'name', 'image_path', 'team_id', 'status'],
                include: [{ model: Team, attributes: ['id', 'name', 'short_name', 'image_path'] }]
            }]
        });

        // --- BOWLERS (Purple Cap) ---
        // Count wickets (excluding run outs)
        const bowlers = await ScoreBall.findAll({
            attributes: [
                'bowler_id',
                [sequelize.literal("COUNT(CASE WHEN is_wicket = 1 AND wicket_type != 'Run Out' THEN 1 ELSE NULL END)"), 'total_wickets'],
                // Overs calculation is complex, approx by balls / 6
                [sequelize.fn('COUNT', sequelize.col('ScoreBall.id')), 'balls_bowled'],
                [sequelize.literal("SUM(runs_scored + extras)"), 'runs_conceded']
            ],
            where: {
                ...fixtureFilter,
                bowler_id: { [Op.ne]: null }
            },
            group: ['bowler_id'],
            order: [[sequelize.literal('total_wickets'), 'DESC']],
            limit: 10,
            include: [{
                model: Player,
                as: 'Bowler',
                attributes: ['id', 'name', 'image_path', 'team_id', 'status'],
                include: [{ model: Team, attributes: ['id', 'name', 'short_name', 'image_path'] }]
            }]
        });

        // --- MVP POINTS ---
        // We need to fetch ALL data to calc complex points or do complex SQL.
        // For Scale: Fetching stats and calculating in JS for MVP is safer for logic correctness if dataset < 10k balls.
        // Let's do a robust SQL approach for performance.

        /*
            Points System:
            Run: 1 pt
            Four: 1 pt bonus (Total 5? No, usually +1 bonus) -> Implementation: Runs + Fours*1 + Sixes*2
            Wicket: 25 pts
            Catch/Stump: 10 pts
            Dot Ball: 1 pt (bowler)
        */

        const mvpList = await ScoreBall.findAll({
            attributes: [
                'striker_id', 'bowler_id', 'fielder_id',
                'runs_scored', 'is_wicket', 'wicket_type', 'extras', 'extra_type'
            ],
            where: fixtureFilter
        });

        const playerPoints = {};

        mvpList.forEach(ball => {
            // Batting
            if (ball.striker_id) {
                if (!playerPoints[ball.striker_id]) playerPoints[ball.striker_id] = 0;
                playerPoints[ball.striker_id] += ball.runs_scored;
                if (ball.runs_scored === 4) playerPoints[ball.striker_id] += 1; // Bonus
                if (ball.runs_scored === 6) playerPoints[ball.striker_id] += 2; // Bonus
            }

            // Bowling
            if (ball.bowler_id) {
                if (!playerPoints[ball.bowler_id]) playerPoints[ball.bowler_id] = 0;
                if (ball.is_wicket && ball.wicket_type !== 'Run Out') {
                    playerPoints[ball.bowler_id] += 25;
                }
                if (ball.runs_scored === 0 && !ball.extras) {
                    playerPoints[ball.bowler_id] += 1; // Dot ball
                }
            }

            // Fielding
            if (ball.fielder_id) {
                if (!playerPoints[ball.fielder_id]) playerPoints[ball.fielder_id] = 0;
                playerPoints[ball.fielder_id] += 10;
            }
        });

        // Convert to Array and Sort
        // Need Player Details -> We need a map of ID -> Player Obj.
        // Optimization: Fetch all players once? Or just fetch for the top 10 IDs.

        const sortedMVP = Object.entries(playerPoints)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const mvpIds = sortedMVP.map(([id]) => id);
        let mvpPlayers = [];
        if (mvpIds.length > 0) {
            mvpPlayers = await Player.findAll({
                where: { id: mvpIds },
                include: [{ model: Team, attributes: ['name', 'short_name', 'image_path'] }]
            });
        }

        const mvpLeaderboard = sortedMVP.map(([id, points]) => {
            const p = mvpPlayers.find(pl => pl.id == id);
            return {
                id,
                points,
                name: p?.name || 'Unknown',
                team: p?.Team || {},
                image: p?.image_path || p?.image,
                status: p?.status || 'Unknown'
            };
        });

        res.json({
            batters,
            bowlers,
            mvp: mvpLeaderboard
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
};
