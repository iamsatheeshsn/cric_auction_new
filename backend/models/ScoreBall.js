const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScoreBall = sequelize.define('ScoreBall', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        fixture_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        innings: {
            type: DataTypes.INTEGER, // 1 or 2
            allowNull: false
        },
        over_number: {
            type: DataTypes.INTEGER, // 0, 1, 2...
            allowNull: false
        },
        ball_number: {
            type: DataTypes.INTEGER, // 1, 2, ... (legal balls)
            allowNull: false
        },

        // Players
        striker_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        non_striker_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        bowler_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // Runs
        runs_scored: {
            type: DataTypes.INTEGER, // Runs off bat
            defaultValue: 0
        },

        // Extras
        extras: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        extra_type: {
            type: DataTypes.ENUM('None', 'Wide', 'NoBall', 'Bye', 'LegBye'),
            defaultValue: 'None'
        },

        // Wicket
        is_wicket: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        wicket_type: {
            type: DataTypes.STRING, // Bowled, Catch, RunOut, etc.
            allowNull: true
        },
        extra_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        player_out_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        fielder_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        // Commentary
        commentary: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shot_area: {
            type: DataTypes.INTEGER, // 1-8 representing sectors
            allowNull: true
        }
    });

    return ScoreBall;
};
