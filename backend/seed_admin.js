const { sequelize, User } = require('./models');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check if user exists
        const existing = await User.findOne({ where: { username: 'admin2' } });
        if (existing) {
            console.log('User admin2 already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await User.create({
            username: 'admin2',
            password: hashedPassword,
            role: 'admin',
            display_name: 'Test Admin',
            avatar: 'https://ui-avatars.com/api/?name=Test+Admin&background=random'
        });

        console.log(`Admin user created: ${admin.username}`);
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

seedAdmin();
