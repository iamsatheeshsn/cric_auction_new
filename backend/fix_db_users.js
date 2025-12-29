const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

const User = require('./models/User')(sequelize);

async function fixUsersTable() {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connected to MySQL.');

        console.log('Dropping Users table...');
        await sequelize.query('DROP TABLE IF EXISTS Users');
        console.log('Users table dropped.');

        console.log('Syncing User model...');
        await User.sync({ force: true });
        console.log('User model recently synced.');

        console.log('Creating default admin...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Default admin created: admin / admin123');
        console.log('SUCCESS: Database repaired.');
        process.exit(0);
    } catch (error) {
        console.error('ERROR repairing database:', error);
        process.exit(1);
    }
}

fixUsersTable();
