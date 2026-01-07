const { ActivityLog } = require('../models');

exports.logActivity = async (userId, action, details, entityType = null, entityId = null) => {
    try {
        if (!userId) {
            console.warn("Attempted to log activity without userId");
            return;
        }
        await ActivityLog.create({
            user_id: userId,
            action,
            details,
            entity_type: entityType,
            entity_id: entityId
        });
        console.log(`[ACTIVITY] User ${userId} - ${action}`);
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};
