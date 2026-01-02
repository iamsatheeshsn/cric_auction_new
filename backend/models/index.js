const sequelize = require('../config/database');
const User = require('./User')(sequelize);
const Auction = require('./Auction')(sequelize);
const Team = require('./Team')(sequelize);
const Player = require('./Player')(sequelize);
const Fixture = require('./Fixture')(sequelize);
const ScoreBall = require('./ScoreBall')(sequelize);
const PointsTable = require('./PointsTable')(sequelize);
const Trade = require('./Trade')(sequelize);
const Bid = require('./Bid')(sequelize);
const TeamShortlist = require('./TeamShortlist')(sequelize);
const Prediction = require('./Prediction')(sequelize);
const FantasyTeam = require('./FantasyTeam')(sequelize);
const FantasyPlayer = require('./FantasyPlayer')(sequelize);

// Associations

const AuctionPlayer = require('./AuctionPlayer')(sequelize);

// ... (previous associations remain) ...

// Prediction Associations
Prediction.belongsTo(User, { foreignKey: 'user_id' });
Prediction.belongsTo(Fixture, { foreignKey: 'fixture_id' });
Prediction.belongsTo(Team, { as: 'PredictedWinner', foreignKey: 'predicted_winner_id' });
User.hasMany(Prediction, { foreignKey: 'user_id' });
Fixture.hasMany(Prediction, { foreignKey: 'fixture_id' });

// Fantasy Associations
FantasyTeam.belongsTo(User, { foreignKey: 'user_id' });
FantasyTeam.belongsTo(Auction, { foreignKey: 'auction_id' });
FantasyTeam.belongsTo(Fixture, { foreignKey: 'fixture_id' });
User.hasMany(FantasyTeam, { foreignKey: 'user_id' });

FantasyTeam.hasMany(FantasyPlayer, { foreignKey: 'fantasy_team_id', onDelete: 'CASCADE' });
FantasyPlayer.belongsTo(FantasyTeam, { foreignKey: 'fantasy_team_id' });

FantasyPlayer.belongsTo(Player, { foreignKey: 'player_id' });

module.exports = {
    sequelize,
    User,
    Auction,
    Team,
    Player,
    Fixture,
    AuctionPlayer,
    ScoreBall,
    PointsTable,
    Trade,
    Bid,
    TeamShortlist,
    Prediction,
    FantasyTeam,
    FantasyPlayer
};

// Associations

// Trade Associations
Trade.belongsTo(Team, { as: 'RequesterTeam', foreignKey: 'requester_team_id' });
Trade.belongsTo(Team, { as: 'ResponderTeam', foreignKey: 'responder_team_id' });
Trade.belongsTo(Player, { as: 'PlayerToReceive', foreignKey: 'player_to_receive_id' });
Trade.belongsTo(Player, { as: 'PlayerToGive', foreignKey: 'player_to_give_id' });

// Points Table Associations
Auction.hasMany(PointsTable, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
PointsTable.belongsTo(Auction, { foreignKey: 'auction_id' });

// ... (rest of associations) ...



Team.hasOne(PointsTable, { foreignKey: 'team_id', onDelete: 'CASCADE' });
PointsTable.belongsTo(Team, { foreignKey: 'team_id' });

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

// Tournament History Associations
Auction.belongsTo(Team, { as: 'Winner', foreignKey: 'winner_team_id' });
Auction.belongsTo(Team, { as: 'RunnerUp', foreignKey: 'runner_up_team_id' });
Auction.belongsTo(Player, { as: 'ManOfTheSeries', foreignKey: 'man_of_the_series_id' });

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

// Bid Associations (Audit Log)
Bid.belongsTo(Auction, { foreignKey: 'auction_id' });
Bid.belongsTo(Player, { foreignKey: 'player_id' });
Bid.belongsTo(Team, { foreignKey: 'team_id' });

Auction.hasMany(Bid, { foreignKey: 'auction_id', onDelete: 'CASCADE' });
Player.hasMany(Bid, { foreignKey: 'player_id', onDelete: 'CASCADE' });
Team.hasMany(Bid, { foreignKey: 'team_id', onDelete: 'CASCADE' });

// Shortlist Associations
TeamShortlist.belongsTo(Team, { foreignKey: 'team_id' });
TeamShortlist.belongsTo(Player, { foreignKey: 'player_id' });
Team.hasMany(TeamShortlist, { foreignKey: 'team_id', onDelete: 'CASCADE' });


module.exports = {
    sequelize,
    User,
    Auction,
    Team,
    Player,
    Fixture,
    AuctionPlayer,
    ScoreBall,
    PointsTable,
    Trade,
    Bid,
    TeamShortlist,
    Prediction,
    FantasyTeam,
    FantasyPlayer
};
