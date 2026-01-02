require('dotenv').config();
const { ScoreBall, Fixture, Team, AuctionPlayer, Player } = require('./models');

async function fixMixedInnings(fixtureId) {
    try {
        console.log(`Fixing Mixed Innings for Fixture ${fixtureId}...`);

        const fixture = await Fixture.findByPk(fixtureId, {
            include: [
                { model: Team, as: 'Team1', include: [{ model: AuctionPlayer }] },
                { model: Team, as: 'Team2', include: [{ model: AuctionPlayer }] }
            ]
        });

        if (!fixture) { console.error("Fixture not found"); return; }

        // Determine who batted first
        const isTeam1BattingFirst = (fixture.toss_decision === 'Bat' && fixture.toss_winner_id === fixture.Team1.id) ||
            (fixture.toss_decision === 'Bowl' && fixture.toss_winner_id !== fixture.Team1.id);

        const battingFirstTeam = isTeam1BattingFirst ? fixture.Team1 : fixture.Team2;
        const battingSecondTeam = isTeam1BattingFirst ? fixture.Team2 : fixture.Team1;

        console.log(`Batting First: ${battingFirstTeam.name} (Should be Innings 1)`);
        console.log(`Batting Second: ${battingSecondTeam.name} (Should be Innings 2)`);

        const secondTeamPlayerIds = battingSecondTeam.AuctionPlayers.map(ap => ap.player_id);

        // Find balls belonging to Batting Second Team that are marked as Innings 1 (or 0)
        const ballsToFix = await ScoreBall.findAll({
            where: {
                fixture_id: fixtureId,
                striker_id: secondTeamPlayerIds,
                innings: 1 // Incorrectly marked as 1
            }
        });

        console.log(`Found ${ballsToFix.length} balls belonging to ${battingSecondTeam.name} incorrectly marked as Innings 1.`);

        if (ballsToFix.length > 0) {
            const idsToFix = ballsToFix.map(b => b.id);
            await ScoreBall.update(
                { innings: 2 },
                { where: { id: idsToFix } }
            );
            console.log(`Moved ${ballsToFix.length} balls to Innings 2.`);

            // Also update fixture current innings if needed
            if (fixture.current_innings !== 2) {
                fixture.current_innings = 2;
                await fixture.save();
                console.log("Updated Fixture current_innings to 2.");
            }
        } else {
            console.log("No incorrect balls found. Maybe Innings are already correct?");
        }

    } catch (error) {
        console.error("Fix Failed:", error);
    }
    process.exit(0);
}

fixMixedInnings(2);
