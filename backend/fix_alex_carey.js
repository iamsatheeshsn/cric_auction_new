const { Player } = require('./models');

async function fixPlayer() {
    try {
        const player = await Player.findOne({ where: { name: 'Alex Carey' } });
        if (player) {
            console.log(`Updating ${player.name}... Old Bowling: ${player.bowling_type}`);
            player.bowling_type = 'None';
            await player.save();
            console.log(`Updated! New Bowling: ${player.bowling_type}`);
        } else {
            console.log('Player Alex Carey not found');
        }
    } catch (e) {
        console.error(e);
    }
}

fixPlayer();
