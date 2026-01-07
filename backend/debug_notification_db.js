const { sequelize, User, Notification } = require('./models');

async function testNotification() {
    try {
        await sequelize.authenticate();
        console.log('DB Connection successful.');

        // 1. Check if table exists (implicit by querying)

        // 2. Find a user
        const user = await User.findOne();
        if (!user) {
            console.log('No users found to attach notification to.');
            return;
        }
        console.log('Found User:', user.username, 'ID:', user.id);

        // 3. Create Notification
        const note = await Notification.create({
            userId: user.id,
            type: 'INFO',
            message: 'Test Notification from Debug Script ' + new Date().toISOString(),
            link: '/dashboard',
            isRead: false
        });
        console.log('Notification Created:', note.toJSON());

        // 4. Fetch Notifications
        const list = await Notification.findAll({
            where: { userId: user.id }
        });
        console.log('Total Notifications for user:', list.length);

    } catch (error) {
        console.error('Error during notification test:', error);
    } finally {
        await sequelize.close();
    }
}

testNotification();
