
require('dotenv').config({ path: './backend/.env' });
const { sequelize, Fixture, ScoreBall, Team, Player, AuctionPlayer } = require('./backend/models');

async function debugAnalytics() {
    try {
        const fixtureId = 2; // As per user request

        // Emulate getMatchScoringDetails logic
        const fixture = await Fixture.findByPk(fixtureId, {
            include: [
                {
                    model: Team, as: 'Team1',
                },
                {
                    model: Team, as: 'Team2',
                }
            ]
        });

        if (!fixture) {
            console.log("Fixture 2 not found");
            return;
        }

        const balls = await ScoreBall.findAll({
            where: { fixture_id: fixtureId },
            order: [['innings', 'ASC'], ['over_number', 'ASC'], ['ball_number', 'ASC']]
        });

        console.log(`Fixture: ${fixture.Team1.name} vs ${fixture.Team2.name}`);
        console.log(`Total Balls: ${balls.length}`);

        if (balls.length > 0) {
            const b = balls[0];
            console.log("Sample Ball:", JSON.stringify(b.toJSON()));
            console.log("Innings Type:", typeof b.innings); // Should be number
            console.log("Runs Type:", typeof b.runs_scored); // Should be number
            console.log("Over Type:", typeof b.over_number); // Should be number
        }

    } catch (e) {
        console.error(e);
    } finally {
        sequelize.close();
    }
}

debugAnalytics();
