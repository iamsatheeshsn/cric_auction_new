const { sequelize, ScoreBall, Player } = require('./models');
const { Op } = require('sequelize');

async function fixDatabase() {
    try {
        console.log('Starting Database Fix...');

        // 1. Identify Invalid Fielder IDs
        // Find all ScoreBalls with non-null fielder_id
        const scores = await ScoreBall.findAll({
            where: {
                fielder_id: { [Op.ne]: null }
            },
            attributes: ['id', 'fielder_id']
        });

        console.log(`Found ${scores.length} records with fielder_id.`);

        // Get all valid Player IDs
        const players = await Player.findAll({ attributes: ['id'] });
        const playerIds = new Set(players.map(p => p.id));

        let fixedCount = 0;

        for (const score of scores) {
            if (!playerIds.has(score.fielder_id)) {
                console.log(`Fixing ScoreBall ID ${score.id}: Invalid fielder_id ${score.fielder_id} -> NULL`);
                await ScoreBall.update({ fielder_id: null }, { where: { id: score.id } });
                fixedCount++;
            }
        }

        console.log(`\nDatabase Fix Completed!`);
        console.log(`Fixed ${fixedCount} records.`);
        console.log(`You can now start the server.`);

    } catch (error) {
        console.error('Fix Failed:', error);
    } finally {
        await sequelize.close();
    }
}

fixDatabase();
