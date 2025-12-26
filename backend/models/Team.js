const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Team = sequelize.define('Team', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        short_name: { // e.g. CSK
            type: DataTypes.STRING,
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        players_per_team: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        purse_remaining: {
            type: DataTypes.INTEGER,
            defaultValue: 0 // Will be set based on Auction points initially
        }
    });

    return Team;
};
