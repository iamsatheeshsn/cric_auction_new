const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find if admin exists
        let admin = await User.findOne({ where: { username: 'admin' } });

        // Generate new hash for 'admin123'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        if (admin) {
            console.log('Admin user found. Resetting password...');
            admin.password = hashedPassword;
            await admin.save();
            console.log('Password reset to: admin123');
        } else {
            console.log('Admin user NOT found. Creating new admin...');
            await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'superadmin'
            });
            console.log('Admin created with password: admin123');
        }

    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await sequelize.close();
    }
}

resetAdmin();
