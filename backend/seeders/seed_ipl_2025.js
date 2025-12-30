const sequelize = require('../config/database');
const { Auction, Team, Player, AuctionPlayer } = require('../models');

const seedIPL2025 = async () => {
    try {
        console.log("Starting IPL 2025 Seeding...");

        // Ensure DB connection
        await sequelize.authenticate();

        // 1. Create Auction
        console.log("Creating Auction...");
        const auction = await Auction.create({
            name: 'IPL 2025 Mega Auction',
            auction_date: '2025-02-12', // Future date
            place: 'Jeddah',
            type: 'Professional',
            points_per_team: 10000, // 100 Cr represented as "points" or similar unit
            min_bid: 50, // 50 Lakhs
            bid_increase_by: 2000,
            image_path: 'uploads/auction_default.jpg'
        });

        // 2. Create Teams
        console.log("Creating Teams...");
        const teamsData = [
            { name: 'Chennai Super Kings', short_name: 'CSK', image: 'csk.png' }, // Images are placeholders
            { name: 'Royal Challengers Bangalore', short_name: 'RCB', image: 'rcb.png' },
            { name: 'Mumbai Indians', short_name: 'MI', image: 'mi.png' },
            { name: 'Kolkata Knight Riders', short_name: 'KKR', image: 'kkr.png' },
            { name: 'Rajasthan Royals', short_name: 'RR', image: 'rr.png' },
            { name: 'Delhi Capitals', short_name: 'DC', image: 'dc.png' },
            { name: 'Sunrisers Hyderabad', short_name: 'SRH', image: 'srh.png' },
            { name: 'Lucknow Super Giants', short_name: 'LSG', image: 'lsg.png' },
            { name: 'Gujarat Titans', short_name: 'GT', image: 'gt.png' },
            { name: 'Punjab Kings', short_name: 'PBKS', image: 'pbks.png' }
        ];

        const teams = [];
        for (const t of teamsData) {
            const team = await Team.create({
                auction_id: auction.id,
                name: t.name,
                short_name: t.short_name,
                players_per_team: 25,
                purse_remaining: 10000,
                image_path: t.name.toLowerCase().replace(/ /g, '_') + '.png'
            });
            teams.push(team);
        }

        // 3. Create Players (Global + Auction Link)
        console.log("Creating Players...");
        const playersData = [
            // Marquee Set 1
            { name: 'Rishabh Pant', role: 'Wicket Keeper', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 200 },
            { name: 'Shreyas Iyer', role: 'Batsman', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 200 },
            { name: 'KL Rahul', role: 'Wicket Keeper', batting_type: 'Right Hand', bowling_type: 'Unknown', points: 200 },
            { name: 'Arshdeep Singh', role: 'Bowler', batting_type: 'Left Hand', bowling_type: 'Left Arm Fast', points: 200 },
            { name: 'Mohammed Shami', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 200 },
            { name: 'Yuzvendra Chahal', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Leg Spin', points: 200 },

            // Batters
            { name: 'David Warner', role: 'Batsman', batting_type: 'Left Hand', bowling_type: 'Right Arm Spin', points: 200 },
            { name: 'Faf du Plessis', role: 'Batsman', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 200 },
            { name: 'Kane Williamson', role: 'Batsman', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 200 },
            { name: 'Devdutt Padikkal', role: 'Batsman', batting_type: 'Left Hand', bowling_type: 'Right Arm Spin', points: 150 },

            // All Rounders
            { name: 'Glenn Maxwell', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 200 },
            { name: 'Liam Livingstone', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 200 },
            { name: 'Marcus Stoinis', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 200 },
            { name: 'Washington Sundar', role: 'All Rounder', batting_type: 'Left Hand', bowling_type: 'Off Spin', points: 150 },
            { name: 'Venkatesh Iyer', role: 'All Rounder', batting_type: 'Left Hand', bowling_type: 'Medium Fast', points: 150 },

            // Wicket Keepers
            { name: 'Ishan Kishan', role: 'Wicket Keeper', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 200 },
            { name: 'Quinton de Kock', role: 'Wicket Keeper', batting_type: 'Left Hand', bowling_type: 'Unknown', points: 200 },
            { name: 'Jitesh Sharma', role: 'Wicket Keeper', batting_type: 'Right Hand', bowling_type: 'Unknown', points: 50 },

            // Fast Bowlers
            { name: 'Mohammed Siraj', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 200 },
            { name: 'Trent Boult', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Left Arm Fast', points: 200 },
            { name: 'Kagiso Rabada', role: 'Bowler', batting_type: 'Left Hand', bowling_type: 'Right Arm Fast', points: 200 },
            { name: 'Harshal Patel', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Medium', points: 200 },

            // Spinners
            { name: 'Ravichandran Ashwin', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Off Spin', points: 200 },
            { name: 'Rahul Chahar', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Leg Spin', points: 100 },
            { name: 'Noor Ahmad', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Left Arm Chinaman', points: 150 }
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
                    mobile_number: '9999999999', // Dummy
                    dob: '1995-01-01', // Dummy
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

        console.log(`Successfully seeded ${playersData.length} players for IPL 2025!`);
        process.exit(0);

    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
};

seedIPL2025();
