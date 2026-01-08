const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./models');

async function sync() {
    try {
        await sequelize.sync({ alter: true });
        console.log("Database Synced!");
    } catch (error) {
        console.error("Sync failed:", error);
    } finally {
        await sequelize.close();
    }
}

sync();
