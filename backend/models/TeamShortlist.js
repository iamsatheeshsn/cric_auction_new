const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TeamShortlist = sequelize.define('TeamShortlist', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        priority: {
            type: DataTypes.INTEGER, // 1 (High) to 3 (Low)
            defaultValue: 1
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    return TeamShortlist;
};
