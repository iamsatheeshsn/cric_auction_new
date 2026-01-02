require('dotenv').config({ path: './backend/.env' }); // Adjust path if running from root
// Try standard path if above fails or just rely on process.env if loaded
if (!process.env.DB_NAME) require('dotenv').config();

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
        const [indexes] = await connection.execute("SHOW INDEX FROM Users");
        console.log(`Found ${indexes.length} indexes on Users table.`);

        const indexesDrop = [];
        const seenColumns = new Set();

        indexes.forEach(idx => {
            console.log(`- Index: ${idx.Key_name} (Column: ${idx.Column_name})`);

            if (idx.Key_name === 'PRIMARY') return;

            // Identify username indexes
            if (idx.Column_name === 'username') {
                if (idx.Key_name === 'username') {
                    // Keep the standard one 'username' if possible, or mark as seen to keep at least one
                    if (seenColumns.has('username')) {
                        indexesDrop.push(idx.Key_name);
                    } else {
                        seenColumns.add('username');
                    }
                } else {
                    // Any other index on username (username_2, username_3, etc) -> Drop
                    indexesDrop.push(idx.Key_name);
                }
            } else {
                // Other random indexes? (Maybe accidental, maybe valid role index?). 
                // Error says 'Too many keys', implying duplicates. 
                // Safest: Check if it looks like a duplicate generated name.
                // But for now, let's just target 'username' duplicates which is the error source.
            }
        });

        // Filter valid one: We want to keep exactly one 'username' index.
        // My logic above: if I see 'username' named index first, I keep it. If I see 'username_2', I drop it.
        // If I see 'username_2' first, I kept it? 
        // Better logic: Collect all username indexes. Keep the one named 'username'. Drop others. 
        // If 'username' doesn't exist, rename one of them? No, just keep one.

        const usernameIndexes = indexes.filter(i => i.Column_name === 'username' && i.Key_name !== 'PRIMARY');
        const standardIndex = usernameIndexes.find(i => i.Key_name === 'username');

        const toDrop = new Set();

        if (standardIndex) {
            // Keep 'username', drop all others
            usernameIndexes.forEach(i => {
                if (i.Key_name !== 'username') toDrop.add(i.Key_name);
            });
        } else {
            // No standard 'username' index. Keep the first one found, drop others.
            if (usernameIndexes.length > 0) {
                const keep = usernameIndexes[0].Key_name;
                console.log(`Keeping index '${keep}' as the unique constraint.`);
                usernameIndexes.slice(1).forEach(i => toDrop.add(i.Key_name));
            }
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
