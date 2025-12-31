const { Trade, AuctionPlayer, Team, Player, sequelize } = require('../models');

// 1. Initiate Trade
exports.initiateTrade = async (req, res) => {
    try {
        console.log("Received Trade Request Body:", req.body);
        const { auctionId, requesterTeamId, responderTeamId, playerToReceiveId, playerToGiveId, offerAmount, notes } = req.body;

        // Validation: Check if players belong to the stated teams
        const receiverPlayer = await AuctionPlayer.findOne({ where: { auction_id: auctionId, player_id: playerToReceiveId, team_id: responderTeamId } });

        // Allow pure cash trades if playerToGiveId is not provided
        if (playerToGiveId) {
            const giverPlayer = await AuctionPlayer.findOne({ where: { auction_id: auctionId, player_id: playerToGiveId, team_id: requesterTeamId } });
            if (!giverPlayer) {
                return res.status(400).json({ message: 'Invalid trade: Your player does not belong to your team.' });
            }
        }

        if (!receiverPlayer) {
            return res.status(400).json({ message: 'Invalid trade: Target player does not belong to the target team.' });
        }

        const trade = await Trade.create({
            auction_id: auctionId,
            requester_team_id: requesterTeamId,
            responder_team_id: responderTeamId,
            player_to_receive_id: playerToReceiveId,
            player_to_give_id: playerToGiveId || null,
            offer_amount: offerAmount || 0,
            notes,
            status: 'Pending'
        });

        res.status(201).json({ message: 'Trade initiated successfully', trade });

    } catch (error) {
        console.error('Error initiating trade:', error);
        res.status(500).json({ message: 'Error initiating trade', error });
    }
};

// 2. Get Trades
exports.getTrades = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const trades = await Trade.findAll({
            where: { auction_id: auctionId },
            include: [
                { model: Team, as: 'RequesterTeam', attributes: ['id', 'name', 'short_name'] },
                { model: Team, as: 'ResponderTeam', attributes: ['id', 'name', 'short_name'] },
                { model: Player, as: 'PlayerToReceive', attributes: ['id', 'name', 'role', 'image_path'] },
                { model: Player, as: 'PlayerToGive', attributes: ['id', 'name', 'role', 'image_path'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(trades);
    } catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ message: 'Error fetching trades' });
    }
};

// 3. Respond to Trade
exports.respondTrade = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { tradeId, status } = req.body; // 'Accepted' or 'Rejected'
        const trade = await Trade.findByPk(tradeId);

        if (!trade) return res.status(404).json({ message: 'Trade not found' });
        if (trade.status !== 'Pending') return res.status(400).json({ message: 'Trade is already processed' });

        if (status === 'Rejected') {
            trade.status = 'Rejected';
            await trade.save({ transaction: t });
            await t.commit();
            return res.json({ message: 'Trade rejected' });
        }

        // Logic for Accepted Trade
        // Fetch players to get prices
        const playerReceive = await AuctionPlayer.findOne({ where: { auction_id: trade.auction_id, player_id: trade.player_to_receive_id } });

        let playerGive = null;
        if (trade.player_to_give_id) {
            playerGive = await AuctionPlayer.findOne({ where: { auction_id: trade.auction_id, player_id: trade.player_to_give_id } });
        }

        // Fetch Teams
        const requesterTeam = await Team.findByPk(trade.requester_team_id);
        const responderTeam = await Team.findByPk(trade.responder_team_id);

        const offerAmount = Number(trade.offer_amount) || 0;

        // Budget Impact Calculation
        // Requester: Gives Player (Gets Budget Back) - Takes Player (Loses Budget) - Pays Cash (Loses Budget)
        const requesterNetChange = (playerGive ? playerGive.sold_price : 0) - playerReceive.sold_price - offerAmount;

        // Responder: Gives Player (Gets Budget Back) - Takes Player (Loses Budget) + Gets Cash (Gains Budget)
        const responderNetChange = playerReceive.sold_price - (playerGive ? playerGive.sold_price : 0) + offerAmount;

        // Check if teams have enough budget
        if (requesterTeam.purse_remaining + requesterNetChange < 0) {
            await t.rollback();
            return res.status(400).json({ message: `Trade failed: ${requesterTeam.short_name} insufficient funds.` });
        }
        if (responderTeam.purse_remaining + responderNetChange < 0) {
            await t.rollback();
            return res.status(400).json({ message: `Trade failed: ${responderTeam.short_name} insufficient funds.` });
        }

        // --- EXECUTE SWAP ---

        // 1. Swap Players
        // Receive goes to Requester
        const oldTeamIdOfReceive = playerReceive.team_id; // Should be responderTeamId
        playerReceive.team_id = trade.requester_team_id;
        await playerReceive.save({ transaction: t });

        // Give goes to Responder (if exists)
        if (playerGive) {
            playerGive.team_id = trade.responder_team_id;
            await playerGive.save({ transaction: t });
        }

        // 2. Update Budgets
        requesterTeam.purse_remaining += requesterNetChange;
        responderTeam.purse_remaining += responderNetChange;

        await requesterTeam.save({ transaction: t });
        await responderTeam.save({ transaction: t });

        // 3. Update Trade Status
        trade.status = 'Accepted';
        await trade.save({ transaction: t });

        await t.commit();
        res.json({ message: 'Trade accepted and processed successfully!' });

    } catch (error) {
        await t.rollback();
        console.error('Error processing trade:', error);
        res.status(500).json({ message: 'Error processing trade', error: error.message });
    }
};
