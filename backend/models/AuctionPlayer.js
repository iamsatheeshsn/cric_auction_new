const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AuctionPlayer = sequelize.define('AuctionPlayer', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        order_id: { // The "PID" for this specific auction
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: { // Sold, Unsold, Available
            type: DataTypes.STRING,
            defaultValue: 'Available'
        },
        sold_price: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        points: { // Base Price/Points for this auction
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_owner: {
            type: DataTypes.STRING, // 'true'/'false' or 'Yes'/'No' - keeping string for compatibility
            defaultValue: 'false'
        },
        notes: { // Auction specific notes
            type: DataTypes.TEXT,
            allowNull: true
        },
        image_path: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    return AuctionPlayer;
};
