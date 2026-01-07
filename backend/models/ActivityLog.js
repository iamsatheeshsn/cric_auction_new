const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        entity_type: {
            type: DataTypes.STRING, // e.g., 'Auction', 'Player'
            allowNull: true
        },
        entity_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });

    return ActivityLog;
};
