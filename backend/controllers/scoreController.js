const { Fixture, ScoreBall, Player, Team, AuctionPlayer } = require('../models');
const { Op } = require('sequelize');

// Get Match Scoring State
exports.getMatchScoringDetails = async (req, res) => {
    try {
        const { fixtureId } = req.params;
        const fixture = await Fixture.findByPk(fixtureId, {
            include: [
                {
                    model: Team,
                    as: 'Team1',
                    include: [{
                        model: AuctionPlayer,
                        include: [{ model: Player }]
                    }]
                },
                {
                    model: Team,
                    as: 'Team2',
                    include: [{
                        model: AuctionPlayer,
                        include: [{ model: Player }]
                    }]
                }
            ]
        });

        if (!fixture) return res.status(404).json({ message: 'Fixture not found' });

        // Fetch all balls
        const balls = await ScoreBall.findAll({
            where: { fixture_id: fixtureId },
            order: [['innings', 'ASC'], ['over_number', 'ASC'], ['ball_number', 'ASC']]
        });

        // Calculate Score Summary (Basic)
        // Calculate Score Summary
        const calculateInningsScore = (inningsBalls) => {
            let runs = 0;
            let wickets = 0;
            let legalBalls = 0;

            inningsBalls.forEach(b => {
                runs += b.runs_scored + b.extras;
                if (b.is_wicket) wickets++;
                if (b.extra_type !== 'Wide' && b.extra_type !== 'NoBall') {
                    legalBalls++;
                }
            });

            const overs = Math.floor(legalBalls / 6) + '.' + (legalBalls % 6);
            return { runs, wickets, overs, legalBalls };
        };

        const score1 = calculateInningsScore(balls.filter(b => b.innings === 1));
        const score2 = calculateInningsScore(balls.filter(b => b.innings === 2));

        // Win Probability Logic (Basic WASP-lite)
        let winProbability = { team1: 50, team2: 50 };

        // Only calculate if match is Live/Completed AND we are in the 2nd innings (or 1st innings is done)
        // Simplest check: Do we have any balls in innings 2? OR is the match completed?
        const isSecondInningsStarted = balls.some(b => b.innings === 2);

        if ((fixture.status === 'Live' && isSecondInningsStarted) || fixture.status === 'Completed') {
            const innings1Runs = score1.runs;
            const target = innings1Runs + 1;
            const currentRuns = score2.runs;
            const wicketsLost = score2.wickets;
            const totalOvers = fixture.total_overs || 20;

            // Simplified Balls Remaining (approx)
            // Ideally we iterate balls, but simplistic approach:
            const legalBallsBowled = score2.legalBalls;
            const ballsRemaining = (totalOvers * 6) - legalBallsBowled;

            const runsNeeded = target - currentRuns;

            if (ballsRemaining <= 0) {
                // Match Over
                winProbability = runsNeeded <= 0 ? { team1: 0, team2: 100 } : { team1: 100, team2: 0 };
            } else if (runsNeeded <= 0) {
                winProbability = { team1: 0, team2: 100 };
            } else {
                // Heuristic Model
                const rrr = runsNeeded / (ballsRemaining / 6);
                let winP = 50; // Base

                // Adjust based on RRR
                if (rrr > 12) winP = 10;
                else if (rrr > 10) winP = 20;
                else if (rrr > 8) winP = 35;
                else if (rrr > 6) winP = 60;
                else if (rrr <= 6) winP = 80;

                // Adjust for Wickets
                if (wicketsLost >= 8) winP -= 30;
                else if (wicketsLost >= 6) winP -= 15;

                // Cap
                winP = Math.max(0, Math.min(100, winP));

                // If chasing
                winProbability = { team1: 100 - winP, team2: winP };
            }
        }

        // Transform AuctionPlayers -> Players for frontend compatibility
        const fixtureData = fixture.toJSON();

        const transformTeam = (team) => {
            if (team && team.AuctionPlayers) {
                team.Players = team.AuctionPlayers.map(ap => {
                    const img = ap.image_path || ap.Player.image_path;
                    // console.log(`Player ${ap.Player.name}: AP.img=${ap.image_path}, P.img=${ap.Player.image_path}, Final=${img}`);
                    return {
                        ...ap.Player,
                        sold_price: ap.points || ap.sold_price,
                        image_path: img // Prioritize Auction Image
                    };
                });
                // delete team.AuctionPlayers;
            } else {
                team.Players = [];
            }
        };

        transformTeam(fixtureData.Team1);
        transformTeam(fixtureData.Team2);

        res.json({
            fixture: fixtureData,
            balls,
            summary: {
                score1,
                score2
            },
            winProbability
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching scoring details' });
    }
};

// Update Match Status (Toss, etc)
exports.updateMatchState = async (req, res) => {
    try {
        const { fixtureId } = req.params;
        const { status, toss_winner_id, toss_decision, current_innings } = req.body;
        console.log("Updating Match State:", req.body);

        const fixture = await Fixture.findByPk(fixtureId);
        if (!fixture) return res.status(404).json({ message: 'Fixture not found' });

        if (status) fixture.status = status;
        if (toss_winner_id) fixture.toss_winner_id = toss_winner_id;
        if (toss_decision) fixture.toss_decision = toss_decision;
        if (current_innings) fixture.current_innings = current_innings;
        if (req.body.total_overs) fixture.total_overs = req.body.total_overs;

        // Calculate Result if Completed
        if (status === 'Completed') {
            const balls = await ScoreBall.findAll({ where: { fixture_id: fixtureId } });
            // Reload fixture with teams to get names
            const fullFixture = await Fixture.findByPk(fixtureId, {
                include: [{ model: Team, as: 'Team1' }, { model: Team, as: 'Team2' }]
            });

            const calcScore = (inn) => balls.filter(b => b.innings === inn).reduce((acc, b) => ({
                runs: acc.runs + b.runs_scored + b.extras,
                wickets: acc.wickets + (b.is_wicket ? 1 : 0)
                // We need to recalc overs properly or pass it.
                // Wait, score1/score2 in previous code had 'overs'. But here we are recalculating.
                // Simpler: Reuse calculations from getMatchScoringDetails logic? No, duplicate logic is safer for robust controller.
                // Let's rely on the Request Body for total overs or just recalc basics.
                // Actually, the previous code (lines 171-177) calculated runs/wickets but NOT overs.
                // I need to calculate overs here for the stats.
            }), { runs: 0, wickets: 0 });

            // Helper to get legal balls and overs
            const getOvers = (inn) => {
                const innBalls = balls.filter(b => b.innings === inn);
                let legal = 0;
                innBalls.forEach(b => {
                    if (b.extra_type !== 'Wide' && b.extra_type !== 'NoBall') legal++;
                });
                return parseFloat(Math.floor(legal / 6) + '.' + (legal % 6));
            };

            const s1 = calcScore(1);
            s1.overs = getOvers(1);
            const s2 = calcScore(2);
            s2.overs = getOvers(2);

            let resultText = '';
            let winningTeamId = null;

            const team1 = fullFixture.Team1;
            const team2 = fullFixture.Team2;

            // Determine who batted first
            let batFirstId = null;
            if (fixture.toss_decision === 'Bat') {
                batFirstId = fixture.toss_winner_id;
            } else {
                batFirstId = (fixture.toss_winner_id === team1.id) ? team2.id : team1.id;
            }

            const batFirstTeam = (batFirstId === team1.id) ? team1 : team2;
            const batSecondTeam = (batFirstId === team1.id) ? team2 : team1;

            if (s2.runs > s1.runs) {
                resultText = `${batSecondTeam.name} won by ${10 - s2.wickets} wickets`;
                winningTeamId = batSecondTeam.id;
            } else if (s1.runs > s2.runs) {
                resultText = `${batFirstTeam.name} won by ${s1.runs - s2.runs} runs`;
                winningTeamId = batFirstTeam.id;
            } else {
                resultText = "Match Tied";
                winningTeamId = null;
            }

            fixture.result_description = resultText;
            fixture.winning_team_id = winningTeamId;

            // MVP Calculation (Existing Logic - Preserved)
            if (!fixture.player_of_match_id) {
                // ... (MVP logic implied/preserved if I don't overwrite it?
                // I am overwriting it. I'll condense it for brevity or copy it.
                // Since I am replacing a huge chunk, I MUST copy MVP logic or it gets lost.
                // MVP is important.
                try {
                    const playerPerformance = {};
                    balls.forEach(ball => {
                        if (ball.striker_id) {
                            playerPerformance[ball.striker_id] = (playerPerformance[ball.striker_id] || 0) + ball.runs_scored + (ball.runs_scored == 4 ? 1 : 0) + (ball.runs_scored === 6 ? 2 : 0);
                        }
                        if (ball.bowler_id) {
                            if (ball.is_wicket && ball.wicket_type !== 'Run Out') playerPerformance[ball.bowler_id] = (playerPerformance[ball.bowler_id] || 0) + 25;
                            if (ball.runs_scored === 0 && !ball.extras) playerPerformance[ball.bowler_id] = (playerPerformance[ball.bowler_id] || 0) + 1;
                        }
                        if (ball.fielder_id) playerPerformance[ball.fielder_id] = (playerPerformance[ball.fielder_id] || 0) + 10;
                    });
                    let maxP = -1; let mvp = null;
                    for (const pid in playerPerformance) { if (playerPerformance[pid] > maxP) { maxP = playerPerformance[pid]; mvp = pid; } }
                    if (mvp) fixture.player_of_match_id = mvp;
                } catch (e) { console.error("MVP Error", e); }
            }

            // SAVE SCORES FOR NRR
            if (batFirstId === team1.id) {
                fixture.team1_runs = s1.runs; fixture.team1_wickets = s1.wickets; fixture.team1_overs = s1.overs;
                fixture.team2_runs = s2.runs; fixture.team2_wickets = s2.wickets; fixture.team2_overs = s2.overs;
            } else {
                fixture.team2_runs = s1.runs; fixture.team2_wickets = s1.wickets; fixture.team2_overs = s1.overs;
                fixture.team1_runs = s2.runs; fixture.team1_wickets = s2.wickets; fixture.team1_overs = s2.overs;
            }
        } // End of Completed Block

        await fixture.save();

        // RECALCULATE POINTS TABLE
        if (status === 'Completed' && fixture.auction_id) {
            await recalculateAuctionPoints(fixture.auction_id);
        }

        res.json({ message: 'Match state updated', fixture });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating match state' });
    }
};

// Helper: Recalculate Points Table for an Auction
const recalculateAuctionPoints = async (auctionId) => {
    try {
        const { Fixture, PointsTable, Team } = require('../models');

        // 1. Fetch all teams in this auction
        const teams = await Team.findAll({ where: { auction_id: auctionId } });

        // 2. Fetch all COMPLETED fixtures
        const fixtures = await Fixture.findAll({
            where: { auction_id: auctionId, status: 'Completed' }
        });

        // 3. Reset/Init Stats Map
        const stats = {};
        teams.forEach(t => {
            stats[t.id] = {
                team_id: t.id,
                auction_id: auctionId,
                played: 0, won: 0, lost: 0, tied: 0, no_result: 0, points: 0,
                runs_for: 0, overs_for: 0,
                runs_against: 0, overs_against: 0
            };
        });

        // 4. Aggregate Stats
        fixtures.forEach(f => {
            const t1 = stats[f.team1_id];
            const t2 = stats[f.team2_id];
            if (!t1 || !t2) return; // Should not happen

            t1.played++;
            t2.played++;

            // Accumulate Runs/Overs for NRR
            // Helper to convert 19.4 -> 19.666
            const getBalls = (overs) => {
                const o = Math.floor(overs);
                const b = Math.round((overs - o) * 10);
                return (o * 6) + b;
            };

            // Team 1 Stats
            t1.runs_for += f.team1_runs;
            t1.overs_for += getBalls(f.team1_overs); // Accumulate balls temporarily
            t1.runs_against += f.team2_runs;
            t1.overs_against += getBalls(f.team2_overs);

            // Team 2 Stats
            t2.runs_for += f.team2_runs;
            t2.overs_for += getBalls(f.team2_overs);
            t2.runs_against += f.team1_runs;
            t2.overs_against += getBalls(f.team1_overs);

            // Adjust Overs if All Out (For NRR, if all out, overs = total overs of match usually, but standard simple NRR uses actual overs faced unless all out)
            // Standard NRR Rule: If a team is all out, runs_scored divided by FULL QUOTA of overs.
            // We need to check wickets.
            // Fixture has total_overs.
            const fullQuotaBalls = (f.total_overs || 20) * 6;

            if (f.team1_wickets >= 10) {
                // Remove the actual balls faced and add full quota
                t1.overs_for = (t1.overs_for - getBalls(f.team1_overs)) + fullQuotaBalls;

                // For Team 2's "Overs Against", it counts as full quota too corresponding to Team 1 batting
                t2.overs_against = (t2.overs_against - getBalls(f.team1_overs)) + fullQuotaBalls;
            }

            if (f.team2_wickets >= 10) {
                t2.overs_for = (t2.overs_for - getBalls(f.team2_overs)) + fullQuotaBalls;
                t1.overs_against = (t1.overs_against - getBalls(f.team2_overs)) + fullQuotaBalls;
            }

            // Points
            if (f.winning_team_id === f.team1_id) {
                t1.won++;
                t1.points += 2;
                t2.lost++;
            } else if (f.winning_team_id === f.team2_id) {
                t2.won++;
                t2.points += 2;
                t1.lost++;
            } else {
                t1.tied++;
                t1.points += 1;
                t2.tied++;
                t2.points += 1;
            }
        });

        // 5. Calculate Final NRR and Upsert
        for (const tid in stats) {
            const s = stats[tid];

            // NRR = (RunsFor / OversFor) - (RunsAgainst / OversAgainst)
            // Overs are in balls currently
            const oversFor = s.overs_for > 0 ? s.overs_for / 6 : 0;
            const oversAgainst = s.overs_against > 0 ? s.overs_against / 6 : 0;

            const rateFor = oversFor > 0 ? s.runs_for / oversFor : 0;
            const rateAgainst = oversAgainst > 0 ? s.runs_against / oversAgainst : 0;

            s.nrr = parseFloat((rateFor - rateAgainst).toFixed(3));

            // Store Overs back as Standard Float (approx) for Display? 
            // Actually model expects float, but let's just store the balls or standard overs.
            // Let's store standard overs (e.g. 10.3) for display if needed, but NRR is stored directly.
            // The model has 'overs_for' as FLOAT. I'll store actual overs (e.g. 10.5).
            const ballsToOvers = (b) => Math.floor(b / 6) + parseFloat(((b % 6) / 10).toFixed(1));
            s.overs_for = ballsToOvers(s.overs_for);
            s.overs_against = ballsToOvers(s.overs_against);

            // Upsert
            const [record, created] = await PointsTable.findOrCreate({
                where: { auction_id: auctionId, team_id: s.team_id },
                defaults: s
            });

            if (!created) {
                await record.update(s);
            }
        }

        console.log(`Points Table Updated for Auction ${auctionId}`);

    } catch (err) {
        console.error("Points Table Calc Error:", err);
    }
};

// Record a Ball
exports.recordBall = async (req, res) => {
    try {
        const { fixtureId } = req.params;
        const {
            innings, over_number, ball_number,
            striker_id, non_striker_id, bowler_id,
            runs_scored, extras, extra_type,
            is_wicket, wicket_type, player_out_id, fielder_id,
            commentary
        } = req.body;

        const newBall = await ScoreBall.create({
            fixture_id: fixtureId,
            innings, over_number, ball_number,
            striker_id, non_striker_id, bowler_id,
            runs_scored, extras, extra_type,
            is_wicket, wicket_type, player_out_id, fielder_id,
            commentary
        });

        res.status(201).json(newBall);
    } catch (error) {
        console.error("Error recording ball:", error);
        res.status(500).json({ message: 'Error recording ball' });
    }
};

// Undo Last Ball
exports.undoLastBall = async (req, res) => {
    try {
        const { fixtureId } = req.params;
        const lastBall = await ScoreBall.findOne({
            where: { fixture_id: fixtureId },
            order: [['createdAt', 'DESC']]
        });

        if (lastBall) {
            await lastBall.destroy();
            res.json({ message: 'Last ball undone' });
        } else {
            res.status(400).json({ message: 'No balls to undo' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error undoing ball' });
    }
};
