const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Player = sequelize.define('Player', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        // Personal Details
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        father_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        mobile_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: false // User requested *
        },
        role: { // Batsman, Bowler, etc.
            type: DataTypes.STRING,
            allowNull: false
        },
        batting_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        bowling_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tshirt_size: {
            type: DataTypes.STRING,
            allowNull: true
        },
        trouser_size: {
            type: DataTypes.STRING,
            allowNull: true
        },
        notes: { // Global notes (medical etc)
            type: DataTypes.TEXT,
            allowNull: true
        },
        preferred_jersey_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        player_link: {
            type: DataTypes.STRING,
            allowNull: true
        },
        image_path: {
            type: DataTypes.STRING,
            allowNull: false // User requested *
        },

        // Payment Info (Assuming global registration payment, or maybe move to AuctionPlayer? 
        // For now, keeping here as "Registration" usually implies platform registration)
        payment_transaction_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        payment_screenshot_path: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    return Player;
};
