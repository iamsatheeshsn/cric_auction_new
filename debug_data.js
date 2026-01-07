const path = require('path');
require('./backend/node_modules/dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { sequelize, Auction, User, Fixture } = require('./backend/models');

async function debugData() {
    try {
        console.log("Checking Data...");

        // Check Users
        let user = await User.findByPk(1);
        if (!user) {
            console.log("User 1 not found, creating...");
            user = await User.create({
                id: 1,
                username: 'admin',
                password: 'password',
                email: 'admin@example.com',
                role: 'admin'
            });
        }
        console.log("User 1 Exists");

        // Check Auctions
        let auction = await Auction.findByPk(1);
        if (!auction) {
            console.log("Auction 1 not found, creating...");
            auction = await Auction.create({
                id: 1,
                name: 'Test Auction',
                type: 'T20',
                status: 'Live',
                team_owner_budget: 1000000,
                auction_date: new Date(),
                place: 'Mumbai',
                points_per_team: 200,
                min_bid: 200000,
                bid_increase_by: 50000
            });
        }
        console.log("Auction 1 Exists");

        // Check Fixtures (for Match Center test)
        let fixture = await Fixture.findByPk(999);
        if (!fixture) {
            console.log("Fixture 999 not found, creating...");
            fixture = await Fixture.create({
                id: 999,
                auction_id: 1,
                match_order: 1,
                team1_id: null,
                team2_id: null,
                status: 'Scheduled'
            });
        }
        console.log("Fixture 999 Exists");

        process.exit(0);
    } catch (error) {
        console.error("Debug Failed:", error);
        process.exit(1);
    }
}

debugData();
