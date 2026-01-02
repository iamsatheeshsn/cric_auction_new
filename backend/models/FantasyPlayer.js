const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FantasyPlayer = sequelize.define('FantasyPlayer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fantasy_team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        is_captain: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_vice_captain: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return FantasyPlayer;
};
