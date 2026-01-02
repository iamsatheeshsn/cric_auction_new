const { sequelize } = require('./models');

async function fixDatabase() {
    try {
        console.log("Starting cleanup...");
        // Disable FK checks to allow truncation
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log("Truncating FantasyPlayers...");
        await sequelize.query('TRUNCATE TABLE FantasyPlayers');

        console.log("Truncating FantasyTeams...");
        await sequelize.query('TRUNCATE TABLE FantasyTeams');

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("Cleanup complete. Please restart your server if it crashed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
}

fixDatabase();
