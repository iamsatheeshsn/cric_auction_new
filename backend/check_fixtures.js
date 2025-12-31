const { Fixture, Team, ScoreBall } = require('./models');
const { Op } = require('sequelize');

async function checkFixtures() {
    try {
        const fixtures = await Fixture.findAll({
            where: {
                status: 'Completed'
            },
            include: [
                { model: Team, as: 'Team1' },
                { model: Team, as: 'Team2' },
                { model: ScoreBall, as: 'ScoreBalls', attributes: ['id'] } // Count balls
            ],
            order: [['auction_id', 'ASC'], ['id', 'ASC']]
        });

        console.log(`Found ${fixtures.length} completed fixtures.`);

        fixtures.forEach(f => {
            const ballCount = f.ScoreBalls ? f.ScoreBalls.length : 0;
            console.log(`Fixture: ID=${f.id} Auction=${f.auction_id} ${f.Team1?.name} vs ${f.Team2?.name} | Winner: ${f.winning_team_id} | Balls: ${ballCount}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

checkFixtures();
