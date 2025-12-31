const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PointsTable = sequelize.define('PointsTable', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // Match Stats
        played: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        won: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lost: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        tied: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        no_result: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        points: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        nrr: {
            type: DataTypes.FLOAT,
            defaultValue: 0.000
        },
        // NRR Calculation Components
        runs_for: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        overs_for: {
            type: DataTypes.FLOAT, // Stored as decimal overs (e.g. 19.4 = 19 + 4/6)
            defaultValue: 0.0
        },
        runs_against: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        overs_against: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        }
    });

    return PointsTable;
};
