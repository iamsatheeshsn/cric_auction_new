const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FantasyTeam = sequelize.define('FantasyTeam', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        fixture_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        team_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        total_points: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

    return FantasyTeam;
};
