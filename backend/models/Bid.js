const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Bid = sequelize.define('Bid', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    return Bid;
};
