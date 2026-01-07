const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PollVote = sequelize.define('PollVote', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        poll_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        option_index: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    return PollVote;
};
