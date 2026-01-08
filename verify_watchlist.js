const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { sequelize, User, Player, Watchlist } = require('./backend/models');

async function testWatchlist() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync models to ensure table exists (since previous command might have failed)
        await sequelize.sync();
        console.log('Database synced.');

        // 1. Get or Create User
        const [user] = await User.findOrCreate({
            where: { username: 'test_watchlist_user' },
            defaults: { password: 'password123', role: 'user', display_name: 'Test Watcher' }
        });
        console.log(`User ID: ${user.id}`);

        // 2. Get or Create Player
        const [player] = await Player.findOrCreate({
            where: { name: 'Test Player for Watchlist' },
            defaults: { role: 'Batsman', dob: '1990-01-01', image_path: 'default.jpg' }
        });
        console.log(`Player ID: ${player.id}`);

        // 3. Add to Watchlist
        console.log('Adding to watchlist...');
        const [entry, created] = await Watchlist.findOrCreate({
            where: { user_id: user.id, player_id: player.id }
        });

        if (created) console.log('Entry created.');
        else console.log('Entry already existed.');

        // 4. Verify Retrieval
        console.log('Verifying retrieval...');
        const watchlist = await Watchlist.findAll({
            where: { user_id: user.id },
            include: [Player]
        });

        const found = watchlist.find(w => w.player_id === player.id);
        if (found && found.Player.name === 'Test Player for Watchlist') {
            console.log('SUCCESS: Player found in watchlist.');
        } else {
            console.error('FAILURE: Player not found in watchlist.');
        }

        // 5. Remove from Watchlist
        console.log('Removing from watchlist...');
        await Watchlist.destroy({
            where: { user_id: user.id, player_id: player.id }
        });

        const check = await Watchlist.findOne({
            where: { user_id: user.id, player_id: player.id }
        });

        if (!check) {
            console.log('SUCCESS: Player removed from watchlist.');
        } else {
            console.error('FAILURE: Player still in watchlist.');
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

testWatchlist();
