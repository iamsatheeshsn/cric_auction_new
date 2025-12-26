const { sequelize, User, Auction, Team, Player } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync({ force: false });

        // 1. Create Admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.findOrCreate({
            where: { username: 'admin' },
            defaults: { password: hashedPassword }
        });
        console.log('✅ Admin Created');

        // 2. Create Auction
        const [auction, created] = await Auction.findOrCreate({
            where: { name: 'IPL 2025 Mock Auction' },
            defaults: {
                auction_date: new Date(),
                place: 'Mumbai',
                type: 'Cricket',
                points_per_team: 10000, // 100 Cr
                min_bid: 50, // 50 Lakhs
                bid_increase_by: 20,
                image_path: null
            }
        });
        console.log(`✅ Auction Created: ${auction.name} (ID: ${auction.id})`);

        // 3. Create Teams
        const teamsData = [
            { name: 'Chennai Super Kings', short_name: 'CSK', players_per_team: 25, purse_remaining: 10000, image_path: 'uploads/placeholder.png' },
            { name: 'Mumbai Indians', short_name: 'MI', players_per_team: 25, purse_remaining: 10000, image_path: 'uploads/placeholder.png' },
            { name: 'Royal Challengers Bangalore', short_name: 'RCB', players_per_team: 25, purse_remaining: 10000, image_path: 'uploads/placeholder.png' },
        ];

        for (const t of teamsData) {
            await Team.findOrCreate({
                where: { name: t.name, auction_id: auction.id },
                defaults: t
            });
        }
        console.log('✅ Teams Created');

        console.log('SEEDING COMPLETE! You can now browse the app.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
