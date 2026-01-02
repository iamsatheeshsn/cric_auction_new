const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Auction = sequelize.define('Auction', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        auction_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        place: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false // e.g., "T20", "Test", "Club"
        },
        points_per_team: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        min_bid: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        bid_increase_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING,
            allowNull: true // Optional image
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Upcoming', // Upcoming, Live, Paused, Completed
            defaultValue: 'Upcoming', // Upcoming, Live, Paused, Completed
            allowNull: false
        },
        current_player_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        current_bid_amount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: true
        },
        current_bidder_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // Tournament History
        winner_team_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        runner_up_team_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        man_of_the_series_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });

    return Auction;
};
