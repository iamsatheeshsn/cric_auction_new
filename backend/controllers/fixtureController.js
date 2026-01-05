const { Fixture, Team, Auction, ScoreBall } = require('../models');

exports.generateFixtures = async (req, res) => {
    try {
        const { auctionId, match_date, venue } = req.body;
        if (!auctionId) return res.status(400).json({ message: 'Auction ID is required' });

        // Check if fixtures already exist
        const existingCount = await Fixture.count({ where: { auction_id: auctionId } });
        if (existingCount > 0) {
            return res.status(400).json({ message: 'Fixtures already exist. Clear them first.' });
        }

        const teams = await Team.findAll({ where: { auction_id: auctionId } });
        if (teams.length < 2) {
            return res.status(400).json({ message: 'Need at least 2 teams to generate fixtures.' });
        }

        // Get Auction details for default venue if not provided
        let defaultVenue = 'TBD';
        if (venue) {
            defaultVenue = venue;
        } else {
            const auction = await Auction.findByPk(auctionId);
            if (auction && auction.place) {
                defaultVenue = auction.place;
            }
        }

        // Round Robin Algorithm
        // 1. Add a dummy team if odd number of teams
        let matchTeams = [...teams];
        if (matchTeams.length % 2 !== 0) {
            matchTeams.push(null); // Dummy team
        }

        const numRounds = matchTeams.length - 1;
        const matchesPerRound = matchTeams.length / 2;
        const fixtures = [];

        for (let round = 0; round < numRounds; round++) {
            for (let match = 0; match < matchesPerRound; match++) {
                const home = matchTeams[match];
                const away = matchTeams[matchTeams.length - 1 - match];

                // If neither is dummy, creating a match
                if (home && away) {
                    fixtures.push({
                        auction_id: auctionId,
                        team1_id: home.id,
                        team2_id: away.id,
                        match_order: (round * matchesPerRound) + match + 1,
                        status: 'Scheduled',
                        venue: defaultVenue,
                        match_date: match_date || null, // Use provided date or null
                        match_type: 'Tournament'
                    });
                }
            }

            // Rotate array (keep first element fixed, rotate others)
            matchTeams.splice(1, 0, matchTeams.pop());
        }

        await Fixture.bulkCreate(fixtures);

        res.json({ message: 'Fixtures generated successfully', count: fixtures.length });

    } catch (error) {
        console.error("Error generating fixtures:", error);
        res.status(500).json({ message: 'Error generating fixtures' });
    }
};

exports.createFixture = async (req, res) => {
    try {
        const { auctionId, team1_id, team2_id, match_date, venue, match_type } = req.body;

        if (!auctionId || !team1_id || !team2_id) {
            return res.status(400).json({ message: "Auction ID and both Team IDs are required" });
        }

        if (team1_id === team2_id) {
            return res.status(400).json({ message: "Cannot schedule a match between the same team" });
        }

        // Get max match order to append to end
        const maxOrder = await Fixture.max('match_order', { where: { auction_id: auctionId } }) || 0;

        const fixture = await Fixture.create({
            auction_id: auctionId,
            team1_id,
            team2_id,
            match_date,
            venue,
            match_order: maxOrder + 1,
            status: 'Scheduled',
            match_type: match_type || 'Tournament'
        });

        res.status(201).json(fixture);
    } catch (error) {
        console.error("Error creating fixture:", error);
        res.status(500).json({ message: 'Error creating fixture' });
    }
};

exports.getFixtures = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const fixtures = await Fixture.findAll({
            where: { auction_id: auctionId },
            include: [
                { model: Team, as: 'Team1', attributes: ['name', 'short_name', 'image_path'] },
                { model: Team, as: 'Team2', attributes: ['name', 'short_name', 'image_path'] }
            ],
            order: [['match_order', 'ASC']]
        });

        // Self-heal: Check for completed matches with missing results
        let updatesMade = false;
        for (const f of fixtures) {
            if (f.status === 'Completed' && !f.result_description) {
                try {
                    const balls = await ScoreBall.findAll({ where: { fixture_id: f.id } });

                    const calcScore = (inn) => balls.filter(b => b.innings === inn).reduce((acc, b) => ({
                        runs: acc.runs + b.runs_scored + b.extras,
                        wickets: acc.wickets + (b.is_wicket ? 1 : 0)
                    }), { runs: 0, wickets: 0 });

                    const score1 = calcScore(1);
                    const score2 = calcScore(2);

                    const team1 = f.Team1;
                    const team2 = f.Team2;

                    // Determine who batted first
                    let batFirstId = null;
                    if (f.toss_decision === 'Bat') {
                        batFirstId = f.toss_winner_id;
                    } else {
                        // If toss winner bowled, existing logic in scoreController implies opposite...
                        // Need accurate check. 
                        // Assuming fetch includes toss details. Yes, Fixture model has them.
                        // However, f.Team1 and f.Team2 might be partial objects due to attributes limit?
                        // findAll include for Team1/Team2 ONLY fetched name, short_name, image_path. ID is in f.team1_id.
                        // We need to compare IDs.
                        batFirstId = (f.toss_winner_id === f.team1_id) ? (f.toss_decision === 'Bat' ? f.team1_id : f.team2_id) :
                            (f.toss_decision === 'Bat' ? f.team2_id : f.team1_id);
                    }

                    // Re-derive names since we have limited attributes
                    const batFirstTeam = (batFirstId === f.team1_id) ? team1 : team2;
                    const batSecondTeam = (batFirstId === f.team1_id) ? team2 : team1;

                    let resultText = '';
                    let winningTeamId = null;

                    if (score2.runs > score1.runs) {
                        resultText = `${batSecondTeam.name} won by ${10 - score2.wickets} wickets`;
                        winningTeamId = batSecondTeam.id || (batFirstId === f.team1_id ? f.team2_id : f.team1_id); // fallback ID usage
                    } else if (score1.runs > score2.runs) {
                        resultText = `${batFirstTeam.name} won by ${score1.runs - score2.runs} runs`;
                        winningTeamId = batFirstTeam.id || batFirstId;
                    } else {
                        resultText = "Match Tied";
                    }

                    f.result_description = resultText;
                    f.winning_team_id = winningTeamId;
                    await f.save();
                    updatesMade = true;
                } catch (err) {
                    console.error("Failed to self-heal fixture result", f.id, err);
                }
            }
        }

        res.json(fixtures);
    } catch (error) {
        console.error("Error fetching fixtures:", error);
        res.status(500).json({ message: 'Error fetching fixtures' });
    }
};

exports.deleteFixtures = async (req, res) => {
    try {
        const { auctionId } = req.params;
        await Fixture.destroy({ where: { auction_id: auctionId } });
        res.json({ message: 'Fixtures cleared successfully' });
    } catch (error) {
        console.error("Error deleting fixtures:", error);
        res.status(500).json({ message: 'Error deleting fixtures' });
    }
};

exports.updateFixture = async (req, res) => {
    try {
        const { id } = req.params;
        const { match_date, venue } = req.body;

        const fixture = await Fixture.findByPk(id);
        if (!fixture) return res.status(404).json({ message: 'Fixture not found' });

        // Handle Date: If provided (string), use it. If explicit empty string, set null.
        if (match_date !== undefined) {
            fixture.match_date = match_date === '' ? null : match_date;
        }

        // Handle Venue: If provided, use it.
        if (venue !== undefined) {
            fixture.venue = venue;
        }

        await fixture.save();
        res.json(fixture);
    } catch (error) {
        console.error("Error updating fixture:", error);
        res.status(500).json({ message: 'Error updating fixture' });
    }
};

exports.deleteFixtureById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Fixture.destroy({ where: { id } });

        if (result === 0) return res.status(404).json({ message: 'Fixture not found' });

        res.json({ message: 'Fixture deleted successfully' });
    } catch (error) {
        console.error("Error deleting fixture:", error);
        res.status(500).json({ message: 'Error deleting fixture' });
    }
};
