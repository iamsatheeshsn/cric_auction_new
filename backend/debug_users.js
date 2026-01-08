const { User, Notification, sequelize } = require('./models');

async function debugUsers() {
    try {
        console.log("--- Debugging Users & Notifications ---");
        const users = await User.findAll();
        console.log(`Total Users: ${users.length}`);

        for (const u of users) {
            const count = await Notification.count({ where: { userId: u.id } });
            console.log(`[User ID: ${u.id}] Username: ${u.username} | Role: ${u.role} | Notification Count: ${count}`);
        }

        console.log("\n--- Checking Global Notifications (userId IS NULL) ---");
        const globalCount = await Notification.count({ where: { userId: null } });
        console.log(`Global Notifications: ${globalCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

debugUsers();
