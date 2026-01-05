const { Fixture, Team, ScoreBall, Auction } = require('../models');
const { Op } = require('sequelize');

exports.getPointsTable = async (req, res) => {
    try {
        const { auctionId } = req.params;

        // Fetch all Completed fixtures for this auction
        const fixtures = await Fixture.findAll({
            where: {
                auction_id: auctionId,
                status: 'Completed',
                match_type: 'Tournament'
            }
        });

        // Initialize Stats Map
        const teams = await Team.findAll({ where: { auction_id: auctionId } });
        const stats = {};

        teams.forEach(team => {
            stats[team.id] = {
                id: team.id,
                name: team.name,
                logo: team.image_path || team.logo_url,
                played: 0,
                won: 0,
                lost: 0,
                tied: 0,
                nr: 0,
                points: 0,
                runsScored: 0,
                oversFaced: 0,
                runsConceded: 0,
                oversBowled: 0
            };
        });

        // Process each fixture
        for (const fixture of fixtures) {
            // Fetch balls for this fixture to get precise runs/overs
            const balls = await ScoreBall.findAll({ where: { fixture_id: fixture.id } });

            // Fix for Ghost Matches: If 0 balls bowled, ignore this fixture
            if (balls.length === 0) continue;

            const t1 = fixture.team1_id;
            const t2 = fixture.team2_id;

            if (!stats[t1] || !stats[t2]) continue; // Skip if team not found (deleted?)

            stats[t1].played++;
            stats[t2].played++;

            // Result
            if (fixture.winning_team_id === t1) {
                stats[t1].won++;
                stats[t1].points += 2;
                stats[t2].lost++;
            } else if (fixture.winning_team_id === t2) {
                stats[t2].won++;
                stats[t2].points += 2;
                stats[t1].lost++;
            } else {
                // Tie or No Result
                stats[t1].tied++;
                stats[t1].points += 1;
                stats[t2].tied++;
                stats[t2].points += 1;
            }

            const processInnings = (inn, battingTeamId, bowlingTeamId) => {
                const innBalls = balls.filter(b => b.innings === inn);
                let runs = 0;
                let legalBalls = 0;
                let wickets = 0;

                innBalls.forEach(b => {
                    runs += b.runs_scored + b.extras;
                    if (b.extra_type !== 'Wide' && b.extra_type !== 'NoBall') legalBalls++;
                    if (b.is_wicket) wickets++;
                });

                // NRR Rule: If team is All Out, overs = Total Overs of match (e.g. 20.0)
                // We'll estimate "All Out" if wickets >= 10 (or team size). 
                // Using 10 as safe default or strict match overs if we had it.
                // Assuming standard Overs from fixture setting if available or 20.
                const matchRestrictedOvers = fixture.total_overs || 20; // Default 20 T20ish

                let oversVal = legalBalls / 6;
                // Check All Out Condition approximation (needs team size strictly but 10 is standard)
                if (wickets >= 10) {
                    oversVal = matchRestrictedOvers;
                }

                stats[battingTeamId].runsScored += runs;
                stats[battingTeamId].oversFaced += oversVal;

                stats[bowlingTeamId].runsConceded += runs;
                stats[bowlingTeamId].oversBowled += oversVal;
            };

            // Innings 1: Team 1 Batting (or Toss Winner decision)
            // We need to know WHO batted first.
            let batFirstId = (fixture.toss_decision === 'Bat' && fixture.toss_winner_id === t1) ? t1 :
                (fixture.toss_decision === 'Bowl' && fixture.toss_winner_id === t2) ? t1 : t2;

            const batSecondId = batFirstId === t1 ? t2 : t1;

            processInnings(1, batFirstId, batSecondId);
            processInnings(2, batSecondId, batFirstId);
        }

        // Final NRR Calc
        const table = Object.values(stats).map(t => {
            const runRateFor = t.oversFaced > 0 ? (t.runsScored / t.oversFaced) : 0;
            const runRateAgainst = t.oversBowled > 0 ? (t.runsConceded / t.oversBowled) : 0;
            const nrr = runRateFor - runRateAgainst;
            return {
                ...t,
                nrr: nrr.toFixed(3)
            };
        });

        // Sort: Points DESC, then NRR DESC
        table.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return parseFloat(b.nrr) - parseFloat(a.nrr);
        });

        res.json(table);

    } catch (error) {
        console.error("Points Table Error:", error);
        res.status(500).json({ message: "Error generating points table" });
    }
};
