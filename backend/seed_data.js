const sequelize = require('./config/database');
const { User, Auction, Team, Player } = require('./models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        await sequelize.sync({ force: true }); // Reset DB
        console.log("Database reset.");

        // 1. Create Admin User
        const hashedPassword = await bcrypt.hash('123456', 10);
        await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });
        console.log("Admin user created (admin/123456)");

        // 2. Create Auction
        const auction = await Auction.create({
            name: 'Mega IPL Auction 2025',
            auction_date: '2025-05-20',
            place: 'Bangalore',
            type: 'Professional',
            points_per_team: 10000,
            min_bid: 200,
            bid_increase_by: 50,
            image_path: 'uploads/auction_default.jpg' // Placeholder
        });
        console.log("Auction created.");

        // 3. Create Teams
        const teamsList = [
            { name: 'Chennai Super Kings', short_name: 'CSK', image: 'uploads/csk_logo.png' },
            { name: 'Royal Challengers Bangalore', short_name: 'RCB', image: 'uploads/rcb_logo.png' },
            { name: 'Mumbai Indians', short_name: 'MI', image: 'uploads/mi_logo.png' },
            { name: 'Kolkata Knight Riders', short_name: 'KKR', image: 'uploads/kkr_logo.png' },
            { name: 'Rajasthan Royals', short_name: 'RR', image: 'uploads/rr_logo.png' },
            { name: 'Delhi Capitals', short_name: 'DC', image: 'uploads/dc_logo.png' },
            { name: 'Sunrisers Hyderabad', short_name: 'SRH', image: 'uploads/srh_logo.png' },
            { name: 'Lucknow Super Giants', short_name: 'LSG', image: 'uploads/lsg_logo.png' },
            { name: 'Gujarat Titans', short_name: 'GT', image: 'uploads/gt_logo.png' },
            { name: 'Punjab Kings', short_name: 'PBKS', image: 'uploads/pbks_logo.png' }
        ];

        for (const t of teamsList) {
            await Team.create({
                auction_id: auction.id,
                name: t.name,
                short_name: t.short_name,
                players_per_team: 25,
                purse_remaining: 10000,
                image_path: t.image
            });
        }
        console.log("All 10 Teams created.");

        // 4. Create Players
        const playersData = [
            // MI
            { name: 'Rohit Sharma', role: 'Batsman', batting_type: 'Right Hand', points: 1500, status: 'Unsold', image_path: 'uploads/rohit.jpg' },
            { name: 'Jasprit Bumrah', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 1400, status: 'Unsold', image_path: 'uploads/bumrah.jpg' },
            { name: 'Suryakumar Yadav', role: 'Batsman', batting_type: 'Right Hand', points: 1350, status: 'Unsold', image_path: 'uploads/sky.jpg' },
            { name: 'Hardik Pandya', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 1300, status: 'Unsold', image_path: 'uploads/hardik.jpg' },

            // CSK
            { name: 'MS Dhoni', role: 'Wicket Keeper', batting_type: 'Right Hand', points: 1200, status: 'Unsold', image_path: 'uploads/dhoni.jpg' },
            { name: 'Ravindra Jadeja', role: 'All Rounder', batting_type: 'Left Hand', bowling_type: 'Left Arm Spin', points: 1400, status: 'Unsold', image_path: 'uploads/jadeja.jpg' },
            { name: 'Ruturaj Gaikwad', role: 'Batsman', batting_type: 'Right Hand', points: 1100, status: 'Unsold', image_path: 'uploads/gaikwad.jpg' },

            // RCB
            { name: 'Virat Kohli', role: 'Batsman', batting_type: 'Right Hand', points: 1600, status: 'Unsold', image_path: 'uploads/virat.jpg' },
            { name: 'Mohammed Siraj', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 1100, status: 'Unsold', image_path: 'uploads/siraj.jpg' },
            { name: 'Glenn Maxwell', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 1250, status: 'Unsold', image_path: 'uploads/maxwell.jpg' },

            // KKR
            { name: 'Shreyas Iyer', role: 'Batsman', batting_type: 'Right Hand', points: 1250, status: 'Unsold', image_path: 'uploads/iyer.jpg' },
            { name: 'Rinku Singh', role: 'Batsman', batting_type: 'Left Hand', points: 900, status: 'Unsold', image_path: 'uploads/rinku.jpg' },
            { name: 'Andre Russell', role: 'All Rounder', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 1300, status: 'Unsold', image_path: 'uploads/russell.jpg' },

            // RR
            { name: 'Sanju Samson', role: 'Wicket Keeper', batting_type: 'Right Hand', points: 1300, status: 'Unsold', image_path: 'uploads/samson.jpg' },
            { name: 'Jos Buttler', role: 'Wicket Keeper', batting_type: 'Right Hand', points: 1400, status: 'Unsold', image_path: 'uploads/buttler.jpg' },
            { name: 'Yashasvi Jaiswal', role: 'Batsman', batting_type: 'Left Hand', points: 1200, status: 'Unsold', image_path: 'uploads/jaiswal.jpg' },

            // DC
            { name: 'Rishabh Pant', role: 'Wicket Keeper', batting_type: 'Left Hand', points: 1400, status: 'Unsold', image_path: 'uploads/pant.jpg' },
            { name: 'Axar Patel', role: 'All Rounder', batting_type: 'Left Hand', bowling_type: 'Left Arm Spin', points: 1100, status: 'Unsold', image_path: 'uploads/axar.jpg' },

            // GT
            { name: 'Shubman Gill', role: 'Batsman', batting_type: 'Right Hand', points: 1400, status: 'Unsold', image_path: 'uploads/gill.jpg' },
            { name: 'Rashid Khan', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Spin', points: 1500, status: 'Unsold', image_path: 'uploads/rashid.jpg' },

            // LSG
            { name: 'KL Rahul', role: 'Batsman', batting_type: 'Right Hand', points: 1450, status: 'Unsold', image_path: 'uploads/rahul.jpg' },
            { name: 'Nicholas Pooran', role: 'Wicket Keeper', batting_type: 'Left Hand', points: 1200, status: 'Unsold', image_path: 'uploads/pooran.jpg' },

            // SRH
            { name: 'Pat Cummins', role: 'Bowler', batting_type: 'Right Hand', bowling_type: 'Right Arm Fast', points: 1500, status: 'Unsold', image_path: 'uploads/cummins.jpg' },
            { name: 'Travis Head', role: 'Batsman', batting_type: 'Left Hand', points: 1100, status: 'Unsold', image_path: 'uploads/head.jpg' },

            // PBKS
            { name: 'Arshdeep Singh', role: 'Bowler', batting_type: 'Left Hand', bowling_type: 'Left Arm Fast', points: 1000, status: 'Unsold', image_path: 'uploads/arshdeep.jpg' },
            { name: 'Sam Curran', role: 'All Rounder', batting_type: 'Left Hand', bowling_type: 'Left Arm Medium', points: 1200, status: 'Unsold', image_path: 'uploads/curran.jpg' }
        ];

        // Map extended defaults
        const completePlayers = playersData.map(p => ({
            ...p,
            auction_id: auction.id,
            dob: '2000-01-01', // Default
            father_name: '-',
            mobile_number: '-',
            tshirt_size: 'M',
            trouser_size: '32',
            is_owner: 'false',
            jersey_no: '00'
        }));

        await Player.bulkCreate(completePlayers);
        console.log("24 Players created.");

        console.log("Seeding complete!");
        process.exit();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
