const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScoutingNote = sequelize.define('ScoutingNote', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'scouting_notes',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'player_id']
            }
        ]
    });

    return ScoutingNote;
};
