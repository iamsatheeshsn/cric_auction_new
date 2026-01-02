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


// --- SIMULATION ENGINE ---

exports.simulateMatch = async (req, res) => {
    try {
        const { fixtureId } = req.params;
        console.log(`Starting Simulation for Fixture ${fixtureId}`);

        const fixture = await Fixture.findByPk(fixtureId, {
            include: [
                {
                    model: Team, as: 'Team1',
                    include: [{ model: AuctionPlayer, include: [{ model: Player }] }]
                },
                {
                    model: Team, as: 'Team2',
                    include: [{ model: AuctionPlayer, include: [{ model: Player }] }]
                }
            ]
        });

        if (!fixture) return res.status(404).json({ message: 'Fixture not found' });
        if (fixture.status === 'Completed') return res.status(400).json({ message: 'Match already completed' });

        // Robust Player Getter
        const getPlayers = (team) => {
            if (!team) return [];
            // Try AuctionPlayers (specific association)
            if (team.AuctionPlayers && Array.isArray(team.AuctionPlayers)) {
                return team.AuctionPlayers.map(ap => ap.Player).filter(Boolean);
            }
            // Fallback: Check if 'Squad' exists (alias issue)
            if (team.Squad && Array.isArray(team.Squad)) {
                return team.Squad.map(ap => ap.Player).filter(Boolean);
            }
            // Fallback: Check 'Players' if standard hasMany was loaded differently
            if (team.Players && Array.isArray(team.Players)) {
                return team.Players;
            }
            console.warn(`No players found for team ${team.name} (ID: ${team.id})`);
            return [];
        };

        const team1Players = getPlayers(fixture.Team1);
        const team2Players = getPlayers(fixture.Team2);

        console.log(`Players Loaded: Team1=${team1Players.length}, Team2=${team2Players.length}`);

        // Current State
        const existingBalls = await ScoreBall.findAll({
            where: { fixture_id: fixtureId },
            order: [['innings', 'ASC'], ['over_number', 'ASC'], ['ball_number', 'ASC']]
        });

        let currentInnings = fixture.current_innings || 1;

        if (fixture.status === 'Scheduled') {
            const tossWinner = Math.random() > 0.5 ? fixture.Team1 : fixture.Team2;
            const decision = Math.random() > 0.5 ? 'Bat' : 'Bowl';
            fixture.status = 'Live';
            fixture.toss_winner_id = tossWinner.id;
            fixture.toss_decision = decision;
            fixture.current_innings = 1;
            await fixture.save();
            currentInnings = 1;
        }

        const generatedBalls = [];

        let simState = {
            innings: currentInnings,
            balls: existingBalls,
            matchOver: false,
            score: {
                1: { runs: 0, wickets: 0, legalBalls: 0 },
                2: { runs: 0, wickets: 0, legalBalls: 0 }
            },
            batsmen: { 1: [], 2: [] },
            outPlayers: { 1: [], 2: [] } // IDs
        };

        existingBalls.forEach(b => {
            const inn = b.innings;
            simState.score[inn].runs += b.runs_scored + b.extras;
            if (b.is_wicket) {
                simState.score[inn].wickets++;
                simState.outPlayers[inn].push(b.player_out_id);
            }
            if (b.extra_type !== 'Wide' && b.extra_type !== 'NoBall') {
                simState.score[inn].legalBalls++;
            }
        });

        const getTeamsForInnings = (inn) => {
            const isTeam1BattingFirst = fixture.toss_decision === 'Bat' ?
                (fixture.toss_winner_id === fixture.Team1.id) :
                (fixture.toss_winner_id !== fixture.Team1.id);

            if (inn === 1) {
                return isTeam1BattingFirst ? { bat: fixture.Team1, bowl: fixture.Team2 } : { bat: fixture.Team2, bowl: fixture.Team1 };
            } else {
                return isTeam1BattingFirst ? { bat: fixture.Team2, bowl: fixture.Team1 } : { bat: fixture.Team1, bowl: fixture.Team2 };
            }
        };

        let safetyCounter = 0;
        while (!simState.matchOver && safetyCounter < 1000) {
            safetyCounter++;

            const { bat: batTeam, bowl: bowlTeam } = getTeamsForInnings(simState.innings);
            const batPlayers = getPlayers(batTeam);
            const bowlPlayers = getPlayers(bowlTeam);

            // Validate Players
            if (batPlayers.length === 0 || bowlPlayers.length === 0) {
                console.error("Simulation Aborted: Missing players in one of the teams.");
                throw new Error("Cannot simulate: One or both teams have no players.");
            }

            let availableBatsmen = batPlayers.filter(p => !simState.outPlayers[simState.innings].includes(p.id));

            let striker, nonStriker;

            const innBalls = [...simState.balls, ...generatedBalls].filter(b => b.innings === simState.innings);

            if (innBalls.length > 0) {
                const lastBall = innBalls[innBalls.length - 1];
                if (lastBall.is_wicket) {
                    const outId = lastBall.player_out_id;
                    const surviverId = (lastBall.striker_id === outId) ? lastBall.non_striker_id : lastBall.striker_id;
                    const survivor = batPlayers.find(p => p.id === surviverId);

                    if (!survivor) {
                        // Fallback logic if survivor ID is invalid (rare)
                        striker = availableBatsmen[0];
                        nonStriker = availableBatsmen[1];
                    } else {
                        const nextBat = availableBatsmen.find(p => p.id !== survivor.id);
                        striker = nextBat;
                        nonStriker = survivor;
                    }
                } else {
                    striker = batPlayers.find(p => p.id === lastBall.striker_id);
                    nonStriker = batPlayers.find(p => p.id === lastBall.non_striker_id);
                }
            } else {
                striker = availableBatsmen[0];
                nonStriker = availableBatsmen[1];
            }

            // Fallback if striker missing (All Out or Logic Gap)
            if (!striker || !nonStriker) {
                // Force All Out
                simState.score[simState.innings].wickets = 10; // Max
                // Trigger inning/match change logic below
            }

            const bowlerCount = Math.max(1, Math.min(5, bowlPlayers.length));
            const bowlers = bowlPlayers.slice(0, bowlerCount);

            const legalBallsSoFar = simState.score[simState.innings].legalBalls;
            const currentOver = Math.floor(legalBallsSoFar / 6);
            const ballsInThisOver = legalBallsSoFar % 6;

            const bowlerIndex = currentOver % bowlerCount;
            const bowler = bowlers[bowlerIndex];

            const totalOvers = fixture.total_overs || 20;
            const maxWickets = Math.min(10, batPlayers.length - 1);

            // EXIT CONDITIONS
            const wicketsDown = simState.score[simState.innings].wickets;

            if (currentOver >= totalOvers || wicketsDown >= maxWickets || !striker) {
                if (simState.innings === 1) {
                    simState.innings = 2;
                    continue;
                } else {
                    simState.matchOver = true;
                    break;
                }
            }

            if (simState.innings === 2) {
                const target = simState.score[1].runs + 1;
                if (simState.score[2].runs >= target) {
                    simState.matchOver = true;
                    break;
                }
            }

            // --- TARGET SCORE LOGIC (Custom) ---
            const customTarget = parseInt(req.body.target_score);
            if (!isNaN(customTarget) && simState.score[simState.innings].runs >= customTarget) {
                // If it's Innings 1, we just swich innings? Or stop if only simulating this fixture.
                // If Innings 1 reaches target, it declares/ends over.
                // Wait, simulation handles "Switch to Innings 2" if innings 1 ends.
                if (simState.innings === 1) {
                    simState.innings = 2;
                    continue; // Start Innings 2 loop
                } else {
                    simState.matchOver = true;
                    break;
                }
            }
            // -----------------------------------

            // Safe Role Access
            const batRole = striker?.role || 'Batsman';
            const bowlRole = bowler?.role || 'Bowler';

            let runProb = (batRole === 'Bowler') ? [60, 20, 5, 0, 10, 5] : [30, 35, 10, 0, 15, 10];
            let wicketProb = (batRole === 'Bowler') ? 15 : 3;

            // --- FORCED WINNER LOGIC ---
            if (req.body.forced_winner_id) {
                const forcedId = String(req.body.forced_winner_id);
                const isWinnerBatting = String(batTeam.id) === forcedId;

                // If Winner is Batting -> Boost Runs, Lower Wickets
                if (isWinnerBatting) {
                    runProb = [10, 20, 15, 0, 30, 25]; // Heavily skewed to boundaries
                    wicketProb = 1; // Very low wicket chance
                } else {
                    // If Loser is Batting -> Limit Runs, Increase Wickets
                    runProb = [70, 25, 5, 0, 0, 0]; // Mostly dots/singles
                    wicketProb = 25; // High wicket chance
                }
            }
            // ---------------------------

            const roll = Math.random() * 100;
            let outcome = {};

            if (roll < wicketProb) {
                const types = ['Caught', 'Bowled', 'lbw'];
                outcome = { type: 'Wicket', runs: 0, wicketType: types[Math.floor(Math.random() * types.length)] };
            } else {
                const runRoll = Math.random() * 100;
                let runs = 0;
                const sum = runProb.reduce((a, b) => a + b, 0);
                const normalized = runProb.map(p => (p / sum) * 100);

                if (runRoll < normalized[0]) runs = 0;
                else if (runRoll < normalized[0] + normalized[1]) runs = 1;
                else if (runRoll < normalized[0] + normalized[1] + normalized[2]) runs = 2;
                else if (runRoll < normalized[0] + normalized[1] + normalized[2] + normalized[3]) runs = 3;
                else if (runRoll < normalized[0] + normalized[1] + normalized[2] + normalized[3] + normalized[4]) runs = 4;
                else runs = 6;

                outcome = { type: 'Runs', runs: runs };
            }

            let comm = "";
            let pOutId = null;
            let wDetails = null;

            if (outcome.type === 'Wicket') {
                comm = `OUT! ${striker.name} is gone! ${outcome.wicketType} by ${bowler.name}.`;
                pOutId = striker.id;
                wDetails = outcome.wicketType;
            } else if (outcome.runs === 4) {
                comm = `FOUR! ${striker.name} smashes it to the boundary!`;
            } else if (outcome.runs === 6) {
                comm = `SIX! HUGE hit by ${striker.name}!`;
            } else {
                comm = `${outcome.runs} runs to ${striker.name}.`;
            }

            const ballData = {
                fixture_id: fixtureId,
                innings: simState.innings,
                over_number: currentOver,
                ball_number: ballsInThisOver + 1,
                striker_id: striker.id,
                non_striker_id: nonStriker.id,
                bowler_id: bowler.id,
                runs_scored: outcome.runs || 0,
                extras: 0,
                extra_type: 'None',
                is_wicket: outcome.type === 'Wicket',
                wicket_type: wDetails,
                player_out_id: pOutId,
                fielder_id: null,
                commentary: comm
            };

            generatedBalls.push(ballData);

            simState.score[simState.innings].runs += ballData.runs_scored;
            simState.score[simState.innings].legalBalls++;
            if (ballData.is_wicket) {
                simState.score[simState.innings].wickets++;
                simState.outPlayers[simState.innings].push(striker.id);
            }
        }

        console.log(`Simulation Loop Ended. Generated ${generatedBalls.length} balls.`);

        if (generatedBalls.length > 0) {
            await ScoreBall.bulkCreate(generatedBalls);
        }

        if (simState.matchOver) {
            fixture.status = 'Completed';

            const { bat: bat1 } = getTeamsForInnings(1);
            const { bat: bat2 } = getTeamsForInnings(2);
            const s1 = simState.score[1];
            const s2 = simState.score[2];

            let resultText = "";
            let winId = null;

            if (s2.runs > s1.runs) {
                winId = bat2.id;
                resultText = `${bat2.name} won by ${10 - s2.wickets} wickets (Simulated)`;
            } else if (s1.runs > s2.runs) {
                winId = bat1.id;
                resultText = `${bat1.name} won by ${s1.runs - s2.runs} runs (Simulated)`;
            } else {
                resultText = "Match Tied (Simulated)";
            }

            fixture.result_description = resultText;
            fixture.winning_team_id = winId;
            fixture.current_innings = 2;

            fixture.team1_runs = (bat1.id === fixture.team1_id) ? s1.runs : s2.runs;
            fixture.team1_wickets = (bat1.id === fixture.team1_id) ? s1.wickets : s2.wickets;
            fixture.team2_runs = (bat1.id !== fixture.team1_id) ? s1.runs : s2.runs;
            fixture.team2_wickets = (bat1.id !== fixture.team1_id) ? s1.wickets : s2.wickets;

            await fixture.save();

            if (fixture.auction_id) {
                await recalculateAuctionPoints(fixture.auction_id);
            }
        }

        res.json({ message: 'Simulation Completed', ballsGenerated: generatedBalls.length });

    } catch (error) {
        console.error("Simulation Error", error);
        res.status(500).json({ message: 'Simulation Failed: ' + error.message });
    }
};
