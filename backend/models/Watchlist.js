const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Watchlist = sequelize.define('Watchlist', {
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
        }
    });

    return Watchlist;
};
