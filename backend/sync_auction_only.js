const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Auction } = require('./models');

async function syncAuction() {
    try {
        console.log("Syncing Auction table...");
        await Auction.sync({ alter: true });
        console.log("Auction table synced successfully!");
    } catch (error) {
        console.error("Auction sync failed:", error);
    } finally {
        process.exit();
    }
}

syncAuction();
