const sequelize = require('../config/database');
const { Auction, Team, Player, AuctionPlayer } = require('../models');

const seedBBL2025 = async () => {
    try {
        console.log("Starting Big Bash League 2025 Seeding...");

        // Ensure DB connection
        await sequelize.authenticate();

        // 1. Create Auction
        console.log("Creating Auction...");
        const auction = await Auction.create({
            name: 'Big Bash League 2025',
            auction_date: '2025-12-01', // Future date
            place: 'Melbourne',
            type: 'Professional',
            points_per_team: 2000000, // $2M salary cap approx
            min_bid: 50000,
            bid_increase_by: 10000,
            image_path: 'uploads/auction_default.jpg'
        });

        // 2. Create Teams
        console.log("Creating Teams...");
        const teamsData = [
            { name: 'Adelaide Strikers', short_name: 'ADS', image: 'strikers.png' },
            { name: 'Brisbane Heat', short_name: 'BBH', image: 'heat.png' },
            { name: 'Hobart Hurricanes', short_name: 'HBH', image: 'hurricanes.png' },
            { name: 'Melbourne Renegades', short_name: 'MLR', image: 'renegades.png' },
            { name: 'Melbourne Stars', short_name: 'MLS', image: 'stars.png' },
            { name: 'Perth Scorchers', short_name: 'PRS', image: 'scorchers.png' },
            { name: 'Sydney Sixers', short_name: 'SYS', image: 'sixers.png' },
            { name: 'Sydney Thunder', short_name: 'SYT', image: 'thunder.png' }
        ];

        const teams = [];
        for (const t of teamsData) {
            const team = await Team.create({
                auction_id: auction.id,
                name: t.name,
                short_name: t.short_name,
                players_per_team: 18,
                purse_remaining: 2000000,
                image_path: t.name.toLowerCase().replace(/ /g, '_') + '.png'
            });
            teams.push(team);
        }

        // 3. Create Players (Global + Auction Link)
        console.log("Creating Players...");
        const playersData = [
            // Strikers Key Players
            { name: 'Rashid Khan', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Leg Spin', points: 200000 },
            { name: 'Travis Head', role: 'Batsman', batting_type: 'Left Hand', bowling_type: 'Right Arm Spin', points: 180000 },
            { name: 'Alex Carey', role: 'Wicket Keeper', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 150000 },

            // Heat Key Players
            { name: 'Usman Khawaja', role: 'Batsman', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 160000 },
            { name: 'Marnus Labuschagne', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Leg Spin', points: 170000 },
            { name: 'Michael Neser', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 150000 },

            // Hurricanes Key Players
            { name: 'Tim David', role: 'Batsman', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 190000 },
            { name: 'Matthew Wade', role: 'Wicket Keeper', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 140000 },
            { name: 'Nathan Ellis', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 150000 },

            // Renegades Key Players
            { name: 'Adam Zampa', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Leg Spin', points: 180000 },
            { name: 'Quinton de Kock', role: 'Wicket Keeper', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 200000 },
            { name: 'Jake Fraser-McGurk', role: 'Batsman', batting_type: 'Right Hand', bowling_type: 'Unknown', points: 130000 },

            // Stars Key Players
            { name: 'Glenn Maxwell', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 200000 },
            { name: 'Marcus Stoinis', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 180000 },
            { name: 'Haris Rauf', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 160000 },

            // Scorchers Key Players
            { name: 'Mitchell Marsh', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 200000 },
            { name: 'Jhye Richardson', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 170000 },
            { name: 'Josh Inglis', role: 'Wicket Keeper', batting_type: 'Right Hand', bowling_type: 'Unknown', points: 160000 },

            // Sixers Key Players
            { name: 'Steven Smith', role: 'Batsman', batting_type: 'Right Hand', bowling_type: 'Leg Spin', points: 200000 },
            { name: 'Moises Henriques', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 140000 },
            { name: 'Sean Abbott', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 150000 },

            // Thunder Key Players
            { name: 'David Warner', role: 'Batsman', batting_type: 'Left Hand', bowling_type: 'Right Arm Spin', points: 200000 },
            { name: 'Daniel Sams', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Left Arm Fast', points: 160000 },
            { name: 'Chris Green', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Off Spin', points: 120000 }
        ];

        let order = 1;
        for (const p of playersData) {
            // 1. Create/Find Global Player
            const [player, created] = await Player.findOrCreate({
                where: { name: p.name },
                defaults: {
                    role: p.role,
                    batting_type: p.batting_type,
                    bowling_type: p.bowling_type,
                    mobile_number: '9999999999',
                    dob: '1995-01-01',
                    father_name: '-',
                    tshirt_size: 'L',
                    trouser_size: '34',
                    image_path: 'uploads/default_player.png'
                }
            });

            // 2. Create Auction Entry
            await AuctionPlayer.create({
                auction_id: auction.id,
                player_id: player.id,
                order_id: order++,
                status: 'Available',
                points: p.points, // Base Price
                is_owner: 'false'
            });
        }

        console.log(`Successfully seeded ${playersData.length} players for BBL 2025!`);
        process.exit(0);

    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
};

seedBBL2025();
