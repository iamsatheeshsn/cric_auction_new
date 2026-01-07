const { User, sequelize } = require('./backend/models');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const user = await User.findOne({ where: { username: 'admin' } });
        if (!user) {
            console.log("User 'admin' NOT FOUND. Creating...");
            const hashedPassword = await bcrypt.hash('123456', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log("Admin created.");
        } else {
            console.log("User 'admin' FOUND. Resetting password...");
            const hashedPassword = await bcrypt.hash('123456', 10);
            user.password = hashedPassword;
            await user.save();
            console.log("Password reset to '123456'.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

resetPassword();
