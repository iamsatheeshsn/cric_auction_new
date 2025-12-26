const { Fixture, ScoreBall, Player, Team } = require('../models');
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
                    include: [{ model: Player, as: 'Players' }]
                },
                {
                    model: Team,
                    as: 'Team2',
                    include: [{ model: Player, as: 'Players' }]
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

        // Logic to calculate exact overs not implemented fully here (needs legal ball count)
        // For now just returning raw balls

        res.json({
            fixture,
            balls,
            summary: { score1, score2 }
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
            }), { runs: 0, wickets: 0 });

            const score1 = calcScore(1);
            const score2 = calcScore(2);

            let resultText = '';
            let winningTeamId = null;

            const team1 = fullFixture.Team1;
            const team2 = fullFixture.Team2;

            // Determine who batted first
            // If Toss Winner batted, they are Inn 1. If Toss Winner bowled, opponent is Inn 1.
            let batFirstId = null;
            if (fixture.toss_decision === 'Bat') {
                batFirstId = fixture.toss_winner_id;
            } else {
                batFirstId = (fixture.toss_winner_id === team1.id) ? team2.id : team1.id;
            }

            const batFirstTeam = (batFirstId === team1.id) ? team1 : team2;
            const batSecondTeam = (batFirstId === team1.id) ? team2 : team1;

            if (score2.runs > score1.runs) {
                // Bat Second Won
                resultText = `${batSecondTeam.name} won by ${10 - score2.wickets} wickets`;
                winningTeamId = batSecondTeam.id;
            } else if (score1.runs > score2.runs) {
                // Bat First Won
                resultText = `${batFirstTeam.name} won by ${score1.runs - score2.runs} runs`;
                winningTeamId = batFirstTeam.id;
            } else {
                resultText = "Match Tied";
                winningTeamId = null;
            }

            fixture.result_description = resultText;
            fixture.winning_team_id = winningTeamId;

            // Calculate MVP if match is completed and result is determined
            if (fixture.status === 'Completed' && fixture.result_description) {
                // Check if MVP is already assigned
                if (!fixture.player_of_match_id) {
                    try {
                        const allBalls = await ScoreBall.findAll({ where: { fixture_id: fixtureId } });
                        const playerPerformance = {};

                        allBalls.forEach(ball => {
                            // Batting Points
                            if (ball.striker_id) {
                                if (!playerPerformance[ball.striker_id]) playerPerformance[ball.striker_id] = 0;
                                playerPerformance[ball.striker_id] += ball.runs_scored * 1; // 1 point per run
                                if (ball.runs_scored === 4) playerPerformance[ball.striker_id] += 1; // Bonus
                                if (ball.runs_scored === 6) playerPerformance[ball.striker_id] += 2; // Bonus
                            }

                            // Bowling Points
                            if (ball.bowler_id) {
                                if (!playerPerformance[ball.bowler_id]) playerPerformance[ball.bowler_id] = 0;
                                if (ball.is_wicket && ball.wicket_type !== 'Run Out') {
                                    playerPerformance[ball.bowler_id] += 25; // 25 points per wicket
                                }
                                if (ball.runs_scored === 0 && !ball.extras) {
                                    playerPerformance[ball.bowler_id] += 1; // Dot ball bonus
                                }
                            }

                            // Fielding Points (Catch/Run Out)
                            if (ball.fielder_id) {
                                if (!playerPerformance[ball.fielder_id]) playerPerformance[ball.fielder_id] = 0;
                                // 10 points for Catch/RunOut/Stumping
                                playerPerformance[ball.fielder_id] += 10;
                            }
                        });

                        // Find Highest
                        let maxPoints = -1;
                        let mvpId = null;
                        for (const pid in playerPerformance) {
                            if (playerPerformance[pid] > maxPoints) {
                                maxPoints = playerPerformance[pid];
                                mvpId = pid;
                            }
                        }

                        if (mvpId) {
                            fixture.player_of_match_id = mvpId;
                        }
                    } catch (calcError) {
                        console.error("MVP Calc Failed", calcError);
                    }
                }
            }
        }

        await fixture.save();
        res.json({ message: 'Match state updated', fixture });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating match state' });
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
