require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixUserIndexes() {
    try {
        console.log("Connecting to Database...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cric_auction_db'
        });

        console.log(`Connected to ${process.env.DB_NAME || 'cric_auction_db'}`);

        // 1. Get Indexes
        const [indexes] = await connection.execute("SHOW INDEX FROM Users"); // Note: Table name might be 'Users' or 'users' depending on OS/Config. Sequelize default defines 'User' -> 'Users'.
        console.log(`Found ${indexes.length} indexes on Users table.`);

        const seenColumns = new Set();
        const toDrop = new Set();

        // Collect username indexes
        const usernameIndexes = indexes.filter(i => i.Column_name === 'username' && i.Key_name !== 'PRIMARY');

        console.log(`Found ${usernameIndexes.length} indexes on 'username' column.`);

        // Strategy: Keep 'username' (if exists), then 'username_unique', then first one found.
        let keepIndexName = null;

        if (usernameIndexes.find(i => i.Key_name === 'username')) {
            keepIndexName = 'username';
        } else if (usernameIndexes.find(i => i.Key_name === 'username_unique')) {
            keepIndexName = 'username_unique';
        } else if (usernameIndexes.length > 0) {
            keepIndexName = usernameIndexes[0].Key_name;
        }

        if (keepIndexName) {
            console.log(`Keeping index '${keepIndexName}'`);
            usernameIndexes.forEach(i => {
                if (i.Key_name !== keepIndexName) {
                    toDrop.add(i.Key_name);
                }
            });
        }

        if (toDrop.size === 0) {
            console.log("No duplicate username indexes found to drop.");
        } else {
            console.log(`Dropping ${toDrop.size} duplicate indexes: ${Array.from(toDrop).join(', ')}`);
            for (const keyName of toDrop) {
                try {
                    await connection.execute(`ALTER TABLE Users DROP INDEX \`${keyName}\``);
                    console.log(`Dropped index: ${keyName}`);
                } catch (e) {
                    console.error(`Failed to drop ${keyName}: ${e.message}`);
                }
            }
        }

        console.log("Fix Complete.");
        await connection.end();

    } catch (error) {
        console.error("Error:", error);
    }
}

fixUserIndexes();
