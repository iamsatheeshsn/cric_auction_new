const { Notification, User } = require('../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch ALL notifications for this user (history) + Global
        const list = await Notification.findAll({
            where: {
                [Op.or]: [
                    { userId: userId },
                    { userId: null }
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.body;
        console.log("MarkAsRead Request:", { id, userId: req.user?.id });
        const userId = req.user.id;

        if (id) {
            // Mark specific
            await Notification.update({ isRead: true }, {
                where: {
                    id: parseInt(id), // Ensure integer
                    userId: userId
                }
            });
        } else {
            // Mark all for user
            await Notification.update({ isRead: true }, {
                where: { userId: userId, isRead: false }
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating notifications' });
    }
};

// Helper to create notification (internal use)
exports.createNotification = async (userId, type, message, link = null, io = null) => {
    try {
        if (userId) {
            // Single User Notification
            const note = await Notification.create({ userId, type, message, link });
            if (io) io.emit('notification', note);
            return note;
        } else {
            // GLOBAL: Create for ALL Users
            const users = await User.findAll({ attributes: ['id'] });
            if (users.length === 0) return;

            const notificationsData = users.map(u => ({
                userId: u.id,
                type,
                message,
                link,
                isRead: false
            }));

            const createdNotes = await Notification.bulkCreate(notificationsData);

            if (io) {
                // Emit generic broadcast for real-time UI
                io.emit('notification', {
                    id: null,
                    userId: null,
                    type,
                    message,
                    link,
                    createdAt: new Date(),
                    isRead: false
                });
            }
            return createdNotes;
        }
    } catch (e) {
        console.error("Failed to create notification", e);
    }
};

exports.sendTestNotification = async (req, res) => {
    try {
        const io = req.app.get('io');
        const userId = req.user.id;

        await exports.createNotification(
            userId,
            'SUCCESS',
            'This is a test notification from the server!',
            '/dashboard',
            io
        );

        res.json({ message: 'Notification sent!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
};
