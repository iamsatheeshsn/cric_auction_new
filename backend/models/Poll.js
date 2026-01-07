const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Poll = sequelize.define('Poll', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        question: {
            type: DataTypes.STRING,
            allowNull: false
        },
        options: {
            type: DataTypes.JSON, // Stores array of strings ["Option A", "Option B"]
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    return Poll;
};
