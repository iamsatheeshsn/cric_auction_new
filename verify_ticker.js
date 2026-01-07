const axios = require('axios');
const path = require('path');
require('./backend/node_modules/dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { sequelize, Auction, AuctionPlayer, Player, Team } = require('./backend/models');

const API_URL = 'http://localhost:5000/api/auctions/ticker/recent-sales';

async function verifyTicker() {
    try {
        console.log("--- Verifying Ticker API ---");

        // 1. Ensure Data Exists
        const liveAuction = await Auction.findOne({ where: { status: 'Live' } });
        if (!liveAuction) {
            console.log("No Live Auction found. Creating one...");
            await Auction.create({
                name: 'Ticker Test Auction',
                type: 'T20',
                status: 'Live',
                team_owner_budget: 1000000,
                auction_date: new Date(),
                place: 'Virtual',
                points_per_team: 100,
                min_bid: 1000,
                bid_increase_by: 100
            });
        } else {
            console.log(`Found Live Auction: ${liveAuction.name}`);
        }

        const auctId = liveAuction ? liveAuction.id : 1; // logical fallback or use what we just found/created

        // Ensure a Sold Player
        const soldPlayer = await AuctionPlayer.findOne({
            where: {
                auction_id: auctId,
                status: 'Sold'
            }
        });

        if (!soldPlayer) {
            console.log("No Sold Player found. Creating one...");
            // Need a player and team first
            let player = await Player.findOne();
            if (!player) player = await Player.create({ name: 'Test Player', role: 'Batsman' });

            let team = await Team.findOne();
            if (!team) team = await Team.create({ name: 'Test Team', short_name: 'TT', auction_id: auctId });

            await AuctionPlayer.create({
                auction_id: auctId,
                player_id: player.id,
                team_id: team.id,
                status: 'Sold',
                sold_price: 5000000,
                order_id: 1,
                points: 10
            });
        } else {
            console.log("Found Sold Player for Ticker test.");
        }

        // 2. Call API
        console.log(`Fetching ${API_URL}...`);
        const res = await axios.get(API_URL);

        console.log("API Response Status:", res.status);
        console.log("Ticker Items:", res.data.length);

        if (res.data.length > 0) {
            console.log("Sample Item:", JSON.stringify(res.data[0], null, 2));
            console.log("✅ Ticker API Verified Successfully");
        } else {
            console.error("❌ Ticker API returned empty array despite having data.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
        process.exit(1);
    }
}

verifyTicker();
