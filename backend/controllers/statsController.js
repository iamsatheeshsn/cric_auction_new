const { ScoreBall, Player, Team, Fixture, AuctionPlayer, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to get stats for a single player
const getPlayerStats = async (playerId) => {
    // 1. Basic Info - Fetch with AuctionPlayer to get Team and Price
    const player = await Player.findByPk(playerId, {
        include: [{
            model: AuctionPlayer,
            include: [{ model: Team }]
        }]
    });
    if (!player) return null;

    let teamName = 'Unsold';
    let price = player.base_price;

    if (player.AuctionPlayers && player.AuctionPlayers.length > 0) {
        const ap = player.AuctionPlayers[0]; // Use the first found auction entry
        if (ap.Team) teamName = ap.Team.name;
        if (ap.sold_price) price = ap.sold_price;
        if (ap.image_path) player.image_path = ap.image_path; // Prioritize Auction Image
    }

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
        image: player.image_path || player.image,
        team: teamName,
        price: price,
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
        let { auctionId } = req.query;
        if (auctionId === 'undefined' || auctionId === 'null') auctionId = undefined;

        // 1. Get relevant Fixture IDs (Filter Scope)
        let fixtureFilter = {};
        if (auctionId) {
            const fixtures = await Fixture.findAll({
                where: { auction_id: auctionId },
                attributes: ['id']
            });
            const fixtureIds = fixtures.map(f => f.id);
            if (fixtureIds.length === 0) {
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
                [sequelize.literal("SUM(CASE WHEN runs_scored = 4 THEN 1 ELSE 0 END)"), 'fours'],
                [sequelize.literal("SUM(CASE WHEN runs_scored = 6 THEN 1 ELSE 0 END)"), 'sixes']
            ],
            where: fixtureFilter,
            group: ['striker_id'],
            order: [[sequelize.literal('total_runs'), 'DESC']],
            limit: 10
        });

        // --- BOWLERS (Purple Cap) ---
        // Count wickets (excluding run outs)
        const bowlers = await ScoreBall.findAll({
            attributes: [
                'bowler_id',
                [sequelize.literal("COUNT(CASE WHEN is_wicket = 1 AND wicket_type != 'Run Out' THEN 1 ELSE NULL END)"), 'total_wickets'],
                [sequelize.fn('COUNT', sequelize.col('ScoreBall.id')), 'balls_bowled'],
                [sequelize.literal("SUM(runs_scored + extras)"), 'runs_conceded']
            ],
            where: {
                ...fixtureFilter,
                bowler_id: { [Op.ne]: null }
            },
            group: ['bowler_id'],
            order: [[sequelize.literal('total_wickets'), 'DESC']],
            limit: 10
        });

        // --- MVP POINTS ---
        // We need to fetch raw data to calculate points because logic is complex
        // Alternatively, use complex literals. For now, fetch raw is safer for correctness.
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

        const sortedMVP = Object.entries(playerPoints)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        // --- ENRICH DATA WITH PLAYER/TEAM INFO ---
        // Need to manually fetch player details for the IDs obtained
        const enrichStats = async (list, idKey) => {
            if (list.length === 0) return [];
            const ids = list.map(item => item[idKey] || item.dataValues[idKey]);
            const players = await Player.findAll({
                where: { id: ids },
                include: [{
                    model: AuctionPlayer,
                    where: auctionId ? { auction_id: auctionId } : {},
                    required: false,
                    include: [{ model: Team, attributes: ['id', 'name', 'short_name', 'image_path'] }]
                }]
            });

            return list.map(item => {
                const id = item[idKey] || item.dataValues[idKey];
                const p = players.find(x => x.id == id);
                let team = null;
                let image = p?.image_path || 'uploads/default_player.png';

                if (p && p.AuctionPlayers && p.AuctionPlayers.length > 0) {
                    // Get the most relevant auction player entry
                    // logic: matches auctionId if provided, else first one
                    const ap = auctionId
                        ? p.AuctionPlayers.find(a => a.auction_id == auctionId)
                        : p.AuctionPlayers[0];

                    if (ap) {
                        team = ap.Team;
                        if (ap.image_path) image = ap.image_path;
                    }
                }

                return {
                    ...item.dataValues, // The stats (total_runs, etc)
                    id: id,
                    name: p?.name || 'Unknown',
                    image: image,
                    Team: team ? {
                        name: team.name,
                        short_name: team.short_name,
                        image_path: team.image_path
                    } : null
                };
            });
        };

        const enrichedBatters = await enrichStats(batters, 'striker_id');
        const enrichedBowlers = await enrichStats(bowlers, 'bowler_id');

        // MVP Enrichment
        const mvpIds = sortedMVP.map(([id]) => id);
        const mvpPlayers = await Player.findAll({
            where: { id: mvpIds },
            include: [{
                model: AuctionPlayer,
                where: auctionId ? { auction_id: auctionId } : {},
                required: false,
                include: [{ model: Team, attributes: ['id', 'name', 'short_name', 'image_path'] }]
            }]
        });

        const finalMVP = sortedMVP.map(([id, points]) => {
            const p = mvpPlayers.find(x => x.id == id);
            let team = null;
            let image = p?.image_path || 'uploads/default_player.png';

            if (p && p.AuctionPlayers && p.AuctionPlayers.length > 0) {
                const ap = auctionId
                    ? p.AuctionPlayers.find(a => a.auction_id == auctionId)
                    : p.AuctionPlayers[0];
                if (ap) {
                    team = ap.Team;
                    if (ap.image_path) image = ap.image_path;
                }
            }
            return {
                id,
                points,
                name: p?.name || 'Unknown',
                image,
                Team: team ? {
                    name: team.name,
                    short_name: team.short_name,
                    image_path: team.image_path
                } : null
            };
        });

        res.json({
            batters: enrichedBatters,
            bowlers: enrichedBowlers,
            mvp: finalMVP
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
};
