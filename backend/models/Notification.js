const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Null means global notification for all users
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR'),
            defaultValue: 'INFO'
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        link: {
            type: DataTypes.STRING,
            allowNull: true // Optional link to redirect user
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return Notification;
};
