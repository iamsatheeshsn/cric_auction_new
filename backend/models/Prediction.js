const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Prediction = sequelize.define('Prediction', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        fixture_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        predicted_winner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        predicted_score: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        points_earned: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Processed'),
            defaultValue: 'Pending'
        }
    });

    return Prediction;
};
