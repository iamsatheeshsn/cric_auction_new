const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./models');
const ScoutingNote = require('./models/ScoutingNote')(sequelize);

async function sync() {
    try {
        await ScoutingNote.sync({ alter: true });
        console.log("ScoutingNote Table Synced!");
    } catch (error) {
        console.error("Sync failed:", error);
    } finally {
        await sequelize.close();
    }
}

sync();
