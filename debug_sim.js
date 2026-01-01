
const { sequelize, Fixture, Team, AuctionPlayer, Player } = require('./backend/models');

async function debugSim() {
    try {
        // Find a fixture
        const fixture = await Fixture.findOne({
            include: [
                {
                    model: Team, as: 'Team1',
                    include: [{ model: AuctionPlayer, include: [{ model: Player }] }]
                }
            ]
        });

        if (!fixture) {
            console.log("No fixture found.");
            return;
        }

        console.log("Fixture ID:", fixture.id);
        console.log("Team1:", fixture.Team1.name);
        console.log("AuctionPlayers Count:", fixture.Team1.AuctionPlayers ? fixture.Team1.AuctionPlayers.length : 'UNDEFINED');
        if (!fixture.Team1.AuctionPlayers) {
            console.log("Keys on Team1:", Object.keys(fixture.Team1.toJSON()));
        }

    } catch (e) {
        console.error(e);
    } finally {
        sequelize.close();
    }
}

debugSim();
