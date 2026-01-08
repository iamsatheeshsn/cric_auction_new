const { Auction, Fixture, Team } = require('../models');
const { Op } = require('sequelize');

exports.getCalendarEvents = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Default to current month if no dates provided
        // But for flexibility, we'll just fetch everything for now or filter if provided
        // Ideally, frontend sends range.

        // Fetch in-memory for simpler mapping (or use raw query for speed if needed)
        // Fetch Auctions
        const auctions = await Auction.findAll({
            where: {},
            attributes: ['id', 'name', 'auction_date', 'place', 'type', 'status', 'image_path']
        });

        // Fetch Fixtures (Matches)
        const fixtures = await Fixture.findAll({
            include: [
                { model: Team, as: 'Team1', attributes: ['id', 'name', 'short_name', 'image_path'] },
                { model: Team, as: 'Team2', attributes: ['id', 'name', 'short_name', 'image_path'] }
            ],
            where: {},
            attributes: ['id', 'match_date', 'venue', 'match_order', 'status', 'stage', 'match_type', 'winning_team_id', 'result_description']
        });

        // Map to unified Event format
        const events = [];

        auctions.forEach(auction => {
            events.push({
                id: `auction_${auction.id}`,
                title: `${auction.name}`,
                start: auction.auction_date,
                type: 'auction',
                status: auction.status,
                image: auction.image_path, // Auction Logo
                details: {
                    place: auction.place,
                    type: auction.type
                }
            });
        });

        fixtures.forEach(fixture => {
            // Check if valid date
            if (fixture.match_date) {
                const team1 = fixture.Team1 ? fixture.Team1.short_name : 'TBD';
                const team2 = fixture.Team2 ? fixture.Team2.short_name : 'TBD';

                events.push({
                    id: `match_${fixture.id}`,
                    title: `${team1} vs ${team2}`,
                    start: fixture.match_date, // ISO Date string
                    type: 'match',
                    status: fixture.status,
                    details: {
                        venue: fixture.venue,
                        stage: fixture.stage,
                        match_type: fixture.match_type,
                        team1_id: fixture.Team1?.id,
                        team2_id: fixture.Team2?.id,
                        team1_logo: fixture.Team1?.image_path,
                        team2_logo: fixture.Team2?.image_path,
                        winner_id: fixture.winning_team_id,
                        result: fixture.result_description
                    }
                });
            }
        });

        res.status(200).json(events);

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ message: 'Server Error fetching calendar events' });
    }
};
