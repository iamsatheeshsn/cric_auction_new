const { ActivityLog } = require('../models');

exports.getRecentActivity = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const logs = await ActivityLog.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to recent 50 actions
        });

        res.json(logs);
    } catch (error) {
        console.error("Fetch Activity Error:", error);
        res.status(500).json({ message: 'Error fetching activity' });
    }
};
