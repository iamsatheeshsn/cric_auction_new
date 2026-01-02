require('dotenv').config();
const { Auction, Fixture, sequelize } = require('./models');
const { Op } = require('sequelize');

async function backfillHistory() {
    try {
        console.log("Starting Backfill of Tournament History...");
        const auctions = await Auction.findAll({
            where: { status: 'Completed' }
        });

        console.log(`Found ${auctions.length} completed auctions.`);

        for (const auction of auctions) {
            console.log(`Checking Auction: ${auction.name} (ID: ${auction.id})`);

            // Check if already populated
            // if (auction.winner_team_id && auction.runner_up_team_id) {
            //     console.log(`  - Already populated. Skipping.`);
            //     continue;
            // }

            // Find Final Match
            const finalMatch = await Fixture.findOne({
                where: {
                    auction_id: auction.id,
                    stage: 'Final',
                    status: 'Completed'
                }
            });

            if (finalMatch && finalMatch.winning_team_id) {
                const winnerId = finalMatch.winning_team_id;
                // Determine Loser
                const loserId = (finalMatch.team1_id === winnerId) ? finalMatch.team2_id : finalMatch.team1_id;

                console.log(`  - Found Final Match (ID: ${finalMatch.id}). Winner: ${winnerId}, RunnerUp: ${loserId}`);

                // Update Auction Winner/RunnerUp
                auction.winner_team_id = winnerId;
                auction.runner_up_team_id = loserId;

                // --- MVP Calculation ---
                console.log(`  - Calculating MVP...`);
                // 1. Get all fixtures for this auction
                const fixtures = await Fixture.findAll({
                    where: { auction_id: auction.id },
                    attributes: ['id']
                });
                const fixtureIds = fixtures.map(f => f.id);

                if (fixtureIds.length > 0) {
                    const { ScoreBall } = require('./models');
                    const balls = await ScoreBall.findAll({
                        where: { fixture_id: fixtureIds }
                    });

                    const playerPoints = {};

                    balls.forEach(ball => {
                        // Batting
                        if (ball.striker_id) {
                            if (!playerPoints[ball.striker_id]) playerPoints[ball.striker_id] = 0;
                            playerPoints[ball.striker_id] += ball.runs_scored;
                            if (ball.runs_scored === 4) playerPoints[ball.striker_id] += 1;
                            if (ball.runs_scored === 6) playerPoints[ball.striker_id] += 2;
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

                    // Find Max
                    let maxPoints = -1;
                    let mvpId = null;
                    for (const [pid, points] of Object.entries(playerPoints)) {
                        if (points > maxPoints) {
                            maxPoints = points;
                            mvpId = pid;
                        }
                    }

                    if (mvpId) {
                        auction.man_of_the_series_id = mvpId;
                        console.log(`  - MVP Calculated: Player ID ${mvpId} (${maxPoints} pts)`);
                    } else {
                        console.log(`  - No stats found for MVP calculation.`);
                    }
                }

                await auction.save();
                console.log(`  - Updated Auction successfully.`);
            } else {
                console.log(`  - No completed Final match found for this auction.`);
            }
        }

        console.log("Backfill Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Backfill Failed:", error);
        process.exit(1);
    }
}

backfillHistory();
