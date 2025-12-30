const sequelize = require('../config/database');
const User = require('./User')(sequelize);
const Auction = require('./Auction')(sequelize);
const Team = require('./Team')(sequelize);
const Player = require('./Player')(sequelize);
const Fixture = require('./Fixture')(sequelize);
const ScoreBall = require('./ScoreBall')(sequelize);

// Associations

const AuctionPlayer = require('./AuctionPlayer')(sequelize);

// Associations

// Auction has many Teams
Auction.hasMany(Team, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
Team.belongsTo(Auction, { foreignKey: 'auction_id' });

// Player - Auction Relationship (Many-to-Many via AuctionPlayer)
// We set up flexible associations so we can query easily
Auction.belongsToMany(Player, { through: AuctionPlayer, foreignKey: 'auction_id' });
Player.belongsToMany(Auction, { through: AuctionPlayer, foreignKey: 'player_id' });

// Explicit Association for attributes access
Auction.hasMany(AuctionPlayer, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
AuctionPlayer.belongsTo(Auction, { foreignKey: 'auction_id' });

Player.hasMany(AuctionPlayer, { foreignKey: 'player_id', onDelete: 'CASCADE' });
AuctionPlayer.belongsTo(Player, { foreignKey: 'player_id' });

// Team - AuctionPlayer Association (Sold Players)
Team.hasMany(AuctionPlayer, { foreignKey: 'team_id' });
AuctionPlayer.belongsTo(Team, { foreignKey: 'team_id' });

// Team Relationship in Auction context
// A player belongs to a team *within* an auction logic
Team.hasMany(AuctionPlayer, { as: 'Squad', foreignKey: 'team_id' });
AuctionPlayer.belongsTo(Team, { foreignKey: 'team_id' });

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
    AuctionPlayer,
    ScoreBall
};
