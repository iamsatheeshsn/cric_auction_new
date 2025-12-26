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
        notes: {
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

        // Payment Info
        payment_transaction_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        payment_screenshot_path: {
            type: DataTypes.STRING,
            allowNull: true
        },

        // Auction Info
        is_owner: { // Is Owner/Icon?
            type: DataTypes.STRING, // Storing as string to handle Dropdown values if needed, or Boolean
            defaultValue: 'No'
        },
        points: { // Given Points/Base Price
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        // System Fields
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: { // Sold, Unsold, Available
            type: DataTypes.STRING,
            defaultValue: 'Available'
        },
        sold_price: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        }
    });

    return Player;
};
