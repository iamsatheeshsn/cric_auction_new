const { User, sequelize } = require('./backend/models');

async function checkAdmin() {
    try {
        console.log("Connecting to DB...");
        // Ensure connection
        await sequelize.authenticate();
        console.log("DB Connected.");

        const user = await User.findOne({ where: { username: 'admin' } });
        if (!user) {
            console.log("User 'admin' NOT FOUND.");
        } else {
            console.log("User 'admin' FOUND.");
            console.log("ID:", user.id);
            console.log("Role:", user.role);
            console.log("Password Hash:", user.password); // Don't log this in prod usually
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        // await sequelize.close(); // Keep open if needed or close
        process.exit();
    }
}

checkAdmin();
