const path = require('path');
require('./backend/node_modules/dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { sequelize } = require('./backend/models');

async function syncDB() {
    try {
        console.log("Syncing Database...");
        await sequelize.sync({ alter: true });
        console.log("Database Synced Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Sync Failed:", error);
        process.exit(1);
    }
}

syncDB();
