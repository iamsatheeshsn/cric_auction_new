const sequelize = require('../config/database');
const User = require('./User')(sequelize);
const Auction = require('./Auction')(sequelize);
const Team = require('./Team')(sequelize);
const Player = require('./Player')(sequelize);
const Fixture = require('./Fixture')(sequelize);
const ScoreBall = require('./ScoreBall')(sequelize);

// Associations

// Auction has many Teams
Auction.hasMany(Team, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
Team.belongsTo(Auction, { foreignKey: 'auction_id' });

// Auction has many Players
Auction.hasMany(Player, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
Player.belongsTo(Auction, { foreignKey: 'auction_id' });

// Team has many Players
Team.hasMany(Player, { as: 'Players', foreignKey: 'team_id' });
Player.belongsTo(Team, { foreignKey: 'team_id' });

// Auction has many Fixtures
Auction.hasMany(Fixture, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
Fixture.belongsTo(Auction, { foreignKey: 'auction_id' });

// Team has many Fixtures
Team.hasMany(Fixture, { as: 'HomeMatches', foreignKey: 'team1_id', onDelete: 'CASCADE' });
Team.hasMany(Fixture, { as: 'AwayMatches', foreignKey: 'team2_id', onDelete: 'CASCADE' });
Fixture.belongsTo(Team, { as: 'Team1', foreignKey: 'team1_id' });
Fixture.belongsTo(Team, { as: 'Team2', foreignKey: 'team2_id' });

// Scoring Associations
Fixture.hasMany(ScoreBall, { foreignKey: 'fixture_id', onDelete: 'CASCADE' });
ScoreBall.belongsTo(Fixture, { foreignKey: 'fixture_id' });

ScoreBall.belongsTo(Player, { as: 'Striker', foreignKey: 'striker_id' });
ScoreBall.belongsTo(Player, { as: 'NonStriker', foreignKey: 'non_striker_id' });
ScoreBall.belongsTo(Player, { as: 'Bowler', foreignKey: 'bowler_id' });
ScoreBall.belongsTo(Player, { as: 'Fielder', foreignKey: 'fielder_id' });

module.exports = {
    sequelize,
    User,
    Auction,
    Team,
    Player,
    Fixture,
    ScoreBall
};
