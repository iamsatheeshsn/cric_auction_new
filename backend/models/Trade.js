const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Trade = sequelize.define('Trade', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        auction_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requester_team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        responder_team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_to_receive_id: { // Player requester WANTS
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_to_give_id: {    // Player requester GIVES
            type: DataTypes.INTEGER,
            allowNull: true // Nullable for cash-only trades (future proof)
        },
        offer_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected', 'Cancelled'),
            defaultValue: 'Pending'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    return Trade;
};
