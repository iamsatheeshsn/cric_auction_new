require('dotenv').config();
const { ScoreBall, Fixture } = require('./models');

async function repairScore(fixtureId) {
    try {
        console.log(`Repairing Fixture ${fixtureId}...`);

        const fixture = await Fixture.findByPk(fixtureId);
        if (!fixture) {
            console.error("Fixture not found!");
            return;
        }

        console.log(`Current Fixture Innings State: ${fixture.current_innings}`);

        // 1. Fix Fixture if needed
        if (!fixture.current_innings || fixture.current_innings === 0) {
            console.log("Fixing Fixture current_innings to 1");
            fixture.current_innings = 1;
            await fixture.save();
        }

        // 2. Fix Balls
        const result = await ScoreBall.update(
            { innings: 1 },
            {
                where: {
                    fixture_id: fixtureId,
                    innings: 0
                }
            }
        );

        console.log(`Updated ${result[0]} balls from innings 0 to innings 1.`);
        console.log("Repair Complete.");

    } catch (error) {
        console.error("Repair Failed:", error);
    }
    process.exit(0);
}

repairScore(2);
