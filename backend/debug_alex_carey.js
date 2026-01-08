const { Player } = require('./models');

async function checkPlayer() {
    try {
        const player = await Player.findOne({ where: { name: 'Alex Carey' } });
        if (player) {
            console.log('Player Found:', player.name);
            console.log('Role:', player.role);
            console.log('Bowling Type:', player.bowling_type);
            console.log('Batting Type:', player.batting_type);
        } else {
            console.log('Player Alex Carey not found');
        }
    } catch (e) {
        console.error(e);
    }
}

checkPlayer();
