const { Notification, sequelize } = require('./models');

async function test() {
    try {
        console.log("Fetching notifications for User 1...");
        const notes = await Notification.findAll({ where: { userId: 1 } });
        console.log(`Found ${notes.length} notifications.`);

        if (notes.length > 0) {
            const firstId = notes[0].id;
            console.log(`Attempting to mark Notification ${firstId} as read...`);

            const [updated] = await Notification.update({ isRead: true }, {
                where: {
                    id: firstId,
                    userId: 1
                }
            });

            console.log(`Updated count: ${updated}`);

            const verify = await Notification.findByPk(firstId);
            console.log(`Notification ${firstId} isRead: ${verify.isRead}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close(); // Close connection to exit script
    }
}

test();
