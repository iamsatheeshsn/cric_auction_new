require('dotenv').config();
const { ScoreBall, Fixture, Team, AuctionPlayer, Player } = require('./models');

async function verifyScore(fixtureId) {
    try {
        console.log(`Verifying Scores for Fixture ${fixtureId}...`);

        const fixture = await Fixture.findByPk(fixtureId, {
            include: [
                { model: Team, as: 'Team1', include: [{ model: AuctionPlayer }] },
                { model: Team, as: 'Team2', include: [{ model: AuctionPlayer }] }
            ]
        });

        if (!fixture) { console.error("Fixture not found"); return; }

        // Map Player IDs to Teams
        const team1Players = fixture.Team1.AuctionPlayers.map(ap => ap.player_id);
        const team2Players = fixture.Team2.AuctionPlayers.map(ap => ap.player_id);

        console.log(`Team 1 (${fixture.Team1.name}) Players: ${team1Players.length}`);
        console.log(`Team 2 (${fixture.Team2.name}) Players: ${team2Players.length}`);

        const balls = await ScoreBall.findAll({
            where: { fixture_id: fixtureId },
            order: [['createdAt', 'ASC']]
        });

        console.log(`Total Balls Found: ${balls.length}`);

        let t1Balls = 0;
        let t2Balls = 0;
        let unknownBalls = 0;

        balls.forEach((b, index) => {
            const isT1 = team1Players.includes(b.striker_id);
            const isT2 = team2Players.includes(b.striker_id);

            let team = 'Unknown';
            if (isT1) { team = 'Team1'; t1Balls++; }
            else if (isT2) { team = 'Team2'; t2Balls++; }
            else unknownBalls++;

            // Log transition or error
            // console.log(`Ball ${index+1}: Striker ${b.striker_id} (${team}) - Innings: ${b.innings}`);

            if ((isT1 && b.innings === 2) || (isT2 && b.innings === 1)) {
                console.warn(`MISMATCH: Ball ${b.id} StrikerId:${b.striker_id} is ${team} but Innings ${b.innings}. (Team1 batted first?)`);
            }
        });

        console.log(`Team 1 Balls Batting: ${t1Balls}`);
        console.log(`Team 2 Balls Batting: ${t2Balls}`);
        console.log(`Unknown Striker Balls: ${unknownBalls}`);

        if (t1Balls > 0 && t2Balls > 0) {
            console.log("CRITICAL: Both teams have batting records.");
            // Check if they are separated correctly by innings
            const t1Innings = balls.filter(b => team1Players.includes(b.striker_id)).map(b => b.innings);
            const t2Innings = balls.filter(b => team2Players.includes(b.striker_id)).map(b => b.innings);

            console.log("Team 1 Innings Set:", [...new Set(t1Innings)]);
            console.log("Team 2 Innings Set:", [...new Set(t2Innings)]);
        }

    } catch (error) {
        console.error("Verification Failed:", error);
    }
    process.exit(0);
}

verifyScore(2);
