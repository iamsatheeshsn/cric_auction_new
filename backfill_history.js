const path = require('path');
// Load dotenv from backend directory
require('./backend/node_modules/dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { Auction, Fixture, sequelize } = require('./backend/models');
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
            if (auction.winner_team_id && auction.runner_up_team_id) {
                console.log(`  - Already populated. Skipping.`);
                continue;
            }

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

                // Update Auction
                auction.winner_team_id = winnerId;
                auction.runner_up_team_id = loserId;
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
