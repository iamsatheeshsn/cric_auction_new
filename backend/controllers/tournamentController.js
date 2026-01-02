const { PointsTable, Team, Auction, Fixture } = require('../models');
const { Op } = require('sequelize');

exports.getPointsTable = async (req, res) => {
    try {
        const { auctionId } = req.params;

        const standings = await PointsTable.findAll({
            where: { auction_id: auctionId },
            include: [
                {
                    model: Team,
                    attributes: ['id', 'name', 'short_name', 'image_path']
                }
            ],
            order: [
                ['points', 'DESC'],
                ['nrr', 'DESC']
            ]
        });

        res.json(standings);
    } catch (error) {
        console.error("Error fetching points table:", error);
        res.status(500).json({ message: 'Error fetching points table' });
    }
};

exports.generateKnockouts = async (req, res) => {
    try {
        const { auctionId } = req.params;

        // 1. Check existing Knockout Fixtures
        // 1. Delete existing Knockout Fixtures to allow regeneration
        await Fixture.destroy({
            where: {
                auction_id: auctionId,
                stage: { [Op.ne]: 'League' }
            }
        });

        // 2. Fetch Standings
        const standings = await PointsTable.findAll({
            where: { auction_id: auctionId },
            order: [['points', 'DESC'], ['nrr', 'DESC']],
            include: [{ model: Team }]
        });

        // 3. Force Fix DB Schema (Temporary robust fix for FK errors)
        try {
            // Check if using MySQL/MariaDB
            const { sequelize } = require('../models');
            await sequelize.query("ALTER TABLE Fixtures MODIFY COLUMN team1_id INTEGER NULL;");
            await sequelize.query("ALTER TABLE Fixtures MODIFY COLUMN team2_id INTEGER NULL;");
            console.log("Forced schema update: team1_id/team2_id are now NULLable.");
        } catch (dbErr) {
            console.warn("Could not auto-fix schema (might not be MySQL or perm issue):", dbErr.message);
        }

        if (standings.length < 2) {
            return res.status(400).json({ message: "Not enough teams for knockouts." });
        }

        const fixtures = [];
        const venue = (await Auction.findByPk(auctionId))?.place || 'TBD';
        const today = new Date();

        if (standings.length >= 4) {
            // IPL Style Playoffs
            // Match 100: Qualifier 1 (1 vs 2) -> Winner to Final, Loser to Q2
            fixtures.push({
                auction_id: auctionId,
                team1_id: standings[0].team_id,
                team2_id: standings[1].team_id,
                match_order: 100,
                status: 'Scheduled',
                venue: venue,
                match_date: new Date(today.setDate(today.getDate() + 1)),
                stage: 'Qualifier 1'
            });

            // Match 101: Eliminator (3 vs 4) -> Winner to Q2, Loser Out
            fixtures.push({
                auction_id: auctionId,
                team1_id: standings[2].team_id,
                team2_id: standings[3].team_id,
                match_order: 101,
                status: 'Scheduled',
                venue: venue,
                match_date: new Date(today.setDate(today.getDate() + 1)), // Next day
                stage: 'Eliminator'
            });

            // Match 102: Qualifier 2 (Loser Q1 vs Winner Eliminator) -> Winner to Final
            fixtures.push({
                auction_id: auctionId,
                team1_id: null, // TBD: Loser Q1
                team2_id: null, // TBD: Winner Eliminator
                match_order: 102,
                status: 'Scheduled',
                venue: venue,
                match_date: new Date(today.setDate(today.getDate() + 2)),
                stage: 'Qualifier 2'
            });

            // Match 103: Final (Winner Q1 vs Winner Q2)
            fixtures.push({
                auction_id: auctionId,
                team1_id: null, // TBD: Winner Q1
                team2_id: null, // TBD: Winner Q2
                match_order: 103,
                status: 'Scheduled',
                venue: venue,
                match_date: new Date(today.setDate(today.getDate() + 2)), // Sunday?
                stage: 'Final'
            });
        } else {
            // Final only (1v2)
            fixtures.push({
                auction_id: auctionId,
                team1_id: standings[0].team_id,
                team2_id: standings[1].team_id,
                match_order: 200,
                status: 'Scheduled',
                venue: venue,
                match_date: new Date(today.setDate(today.getDate() + 1)),
                stage: 'Final'
            });
        }

        await Fixture.bulkCreate(fixtures);
        res.json({ message: "Knockout fixtures generated", fixtures });

    } catch (error) {
        console.error("Knockout Gen Error:", error);
        res.status(500).json({ message: "Error generating knockouts" });
    }
};

exports.getBracket = async (req, res) => {
    try {
        const { auctionId } = req.params;

        // Fetch all non-league fixtures
        const fixtures = await Fixture.findAll({
            where: {
                auction_id: auctionId,
                stage: { [Op.ne]: 'League' }
            },
            include: [
                { model: Team, as: 'Team1', attributes: ['id', 'name', 'short_name', 'image_path'] },
                { model: Team, as: 'Team2', attributes: ['id', 'name', 'short_name', 'image_path'] }
            ],
            order: [['match_order', 'ASC']]
        });

        res.json(fixtures);
    } catch (error) {
        console.error("Bracket Error:", error);
        res.status(500).json({ message: "Error fetching bracket" });
    }
};


exports.markKnockoutWinner = async (req, res) => {
    try {
        const { fixtureId, winnerId } = req.body;
        console.log(`[MarkWinner] Request: Fixture ${fixtureId}, Winner ${winnerId}`);

        const fixture = await Fixture.findByPk(fixtureId);
        if (!fixture) return res.status(404).json({ message: 'Fixture not found' });

        const auctionId = fixture.auction_id;
        const winnerIdInt = parseInt(winnerId, 10);

        // 1. Update Current Fixture
        fixture.winning_team_id = winnerIdInt;
        fixture.status = 'Completed';
        fixture.result_description = 'Match Awarded Manually';
        await fixture.save();
        console.log(`[MarkWinner] Fixture ${fixtureId} marked. Winner: ${winnerIdInt}`);

        // 2. Handle Progression (IPL Style)
        const q2 = await Fixture.findOne({ where: { auction_id: auctionId, stage: 'Qualifier 2' } });
        const final = await Fixture.findOne({ where: { auction_id: auctionId, stage: 'Final' } });

        const loserId = (fixture.team1_id === winnerIdInt) ? fixture.team2_id : fixture.team1_id;
        console.log(`[MarkWinner] Progression Logic. Stage: ${fixture.stage}, Loser: ${loserId}`);

        if (fixture.stage === 'Qualifier 1') {
            // Winner -> Final (Home/Team1)
            if (final) {
                console.log(`[MarkWinner] Advancing Winner ${winnerIdInt} to Final (Team1)`);
                final.team1_id = winnerIdInt;
                await final.save();
            }
            // Loser -> Qualifier 2 (Home/Team1)
            if (q2) {
                console.log(`[MarkWinner] Advancing Loser ${loserId} to Q2 (Team1)`);
                q2.team1_id = loserId;
                await q2.save();
            }
        } else if (fixture.stage === 'Eliminator') {
            // Winner -> Qualifier 2 (Away/Team2)
            if (q2) {
                console.log(`[MarkWinner] Advancing Winner ${winnerIdInt} to Q2 (Team2)`);
                q2.team2_id = winnerIdInt;
                await q2.save();
            }
        } else if (fixture.stage === 'Qualifier 2') {
            // Winner -> Final (Away/Team2)
            if (final) {
                console.log(`[MarkWinner] Advancing Winner ${winnerIdInt} to Final (Team2)`);
                final.team2_id = winnerIdInt;
                await final.save();
            }
        } else if (fixture.stage === 'Final') {
            // 3. Update Auction History since Final is done
            console.log(`[MarkWinner] FINAL Completed. Updating Auction History for AuctionID: ${auctionId}`);
            const auction = await Auction.findByPk(auctionId);
            if (auction) {
                auction.winner_team_id = winnerIdInt;
                auction.runner_up_team_id = loserId;
                await auction.save();
                console.log(`[MarkWinner] Auction ${auctionId} updated. Winner: ${winnerIdInt}, RunnerUp: ${loserId}`);
            }
        }

        res.json({ message: 'Winner updated and progression handled.', fixture });

    } catch (error) {
        console.error('Error marking winner:', error);
        res.status(500).json({ message: 'Error updating winner' });
    }
};
