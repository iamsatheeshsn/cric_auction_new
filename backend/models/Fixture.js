const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Fixture = sequelize.define('Fixture', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        team1_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        team2_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        match_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        venue: {
            type: DataTypes.STRING,
            allowNull: true
        },
        match_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('Scheduled', 'Live', 'Completed', 'Cancelled'),
            defaultValue: 'Scheduled'
        },
        stage: {
            type: DataTypes.STRING,
            defaultValue: 'League' // 'League', 'QuarterFinal', 'SemiFinal', 'Final'
        },
        match_type: {
            type: DataTypes.ENUM('Tournament', 'Friendly'),
            defaultValue: 'Tournament'
        },
        // Match State
        current_innings: {
            type: DataTypes.INTEGER,
            defaultValue: 0 // 0: Not Started, 1: 1st Innings, 2: 2nd Innings, 3: Completed
        },
        toss_winner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        toss_decision: {
            type: DataTypes.STRING, // 'Bat' or 'Bowl'
            allowNull: true
        },
        winning_team_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        result_description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        player_of_match_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        total_overs: {
            type: DataTypes.INTEGER,
            defaultValue: 20
        },
        // Final Scores (Snapshot for NRR/Display)
        team1_runs: { type: DataTypes.INTEGER, defaultValue: 0 },
        team1_wickets: { type: DataTypes.INTEGER, defaultValue: 0 },
        team1_overs: { type: DataTypes.FLOAT, defaultValue: 0.0 },

        team2_runs: { type: DataTypes.INTEGER, defaultValue: 0 },
        team2_wickets: { type: DataTypes.INTEGER, defaultValue: 0 },
        team2_overs: { type: DataTypes.FLOAT, defaultValue: 0.0 }
    });

    return Fixture;
};
