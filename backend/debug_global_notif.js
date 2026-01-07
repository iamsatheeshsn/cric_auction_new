const { sequelize, User, Notification } = require('./models');
const { createNotification } = require('./controllers/notificationController');

async function testGlobalNotification() {
    try {
        await sequelize.authenticate();
        console.log('DB Connection successful.');

        // 1. Create a dummy user if none exists
        let user = await User.findOne();
        if (!user) {
            user = await User.create({ username: 'testuser', password: 'password', role: 'admin' });
            console.log("Created Dummy User:", user.id);
        } else {
            console.log("Found User:", user.id);
        }

        // 2. Trigger Global Notification (userId = null)
        console.log("Creating Global Notification...");
        // Pass a mock 'io' object to avoid errors if controller expects it
        const mockIo = { emit: (evt, data) => console.log(`[MockSocket] Emitted ${evt}:`, data) };

        const result = await createNotification(null, 'INFO', 'Global Test Message ' + Date.now(), '/test', mockIo);

        if (Array.isArray(result)) {
            console.log(`Created ${result.length} notifications.`);

            // 3. Verify IDs
            const check = await Notification.findAll({
                where: { message: result[0].message },
                raw: true
            });

            console.log("--- DB Records ---");
            check.forEach(n => {
                console.log(`ID: ${n.id}, UserId: ${n.userId}, Msg: ${n.message}`);
                if (n.userId === null) console.error("CRITICAL FAILURE: UserId is NULL in DB!");
                else console.log("SUCCESS: UserId is present.");
            });

        } else {
            console.log("Result is not an array (Did it create single?)", result);
        }

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await sequelize.close();
    }
}

testGlobalNotification();
