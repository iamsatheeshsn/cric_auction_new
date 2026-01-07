const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get unread notifications
router.get('/', verifyToken, notificationController.getNotifications);

// Mark as read
router.post('/read', verifyToken, notificationController.markAsRead);

// Test Notification
router.post('/test', verifyToken, notificationController.sendTestNotification);

module.exports = router;
