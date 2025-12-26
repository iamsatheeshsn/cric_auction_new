const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        await sequelize.sync();

        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (adminExists) {
            console.log('Admin already exists.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'superadmin'
        });

        console.log('Super Admin created. Username: admin, Password: admin123');
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await sequelize.close();
    }
}

seedAdmin();
