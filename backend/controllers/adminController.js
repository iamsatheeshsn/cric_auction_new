const { Auction, AuctionPlayer, Team, Player, Bid, sequelize } = require('../models');
const { Op } = require('sequelize');

// Reset Auction
exports.resetAuction = async (req, res) => {
    try {
        const { id } = req.params; // Auction ID

        const auction = await Auction.findByPk(id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Transaction to ensure atomicity
        await sequelize.transaction(async (t) => {
            // 1. Reset all players in this auction to 'Available'
            await AuctionPlayer.update(
                {
                    status: 'Available',
                    sold_price: 0,
                    team_id: null,
                    is_owner: 'false' // Reset owner status if applicable
                },
                { where: { auction_id: id }, transaction: t }
            );

            // 2. Reset Team Purses to original points
            await Team.update(
                { purse_remaining: auction.points_per_team },
                { where: { auction_id: id }, transaction: t } // Assuming Team has auction_id. If not, need finding teams differently.
            );
            // double check Team model if it has auction_id directly or linked via AuctionTeams? 
            // Based on previous reads, Team seems to belongsTo Auction directly (viewed in markSold logic).

            // 3. Clear Bid History for this auction
            await Bid.destroy({
                where: { auction_id: id },
                transaction: t
            });

            // 4. Reset Auction State
            await auction.update({
                current_player_id: null,
                current_bid_amount: 0,
                current_bidder_id: null,
                // Optional: set status to 'Upcoming' or keep it 'Live' depending on preference?
                // User asked to reset "Entire Auction", implies starting fresh.
                // Keeping status as is or setting to 'Upcoming' might be safer. Let's set to 'Upcoming'.
                status: 'Upcoming'
            }, { transaction: t });
        });

        const io = req.app.get('io');
        io.to(`auction_${id}`).emit('auction_reset', { message: 'Auction has been reset by admin.' });

        res.json({ message: 'Auction reset successfully' });
    } catch (error) {
        console.error("Error resetting auction:", error);
        res.status(500).json({ message: 'Error resetting auction', error: error.message });
    }
};

// Export Squads (CSV)
exports.exportSquads = async (req, res) => {
    try {
        const { id } = req.params; // Auction ID

        const players = await AuctionPlayer.findAll({
            where: { auction_id: id, status: 'Sold' },
            include: [
                { model: Player, attributes: ['name', 'role'] },
                { model: Team, attributes: ['name'] }
            ],
            order: [[Team, 'name', 'ASC'], ['sold_price', 'DESC']]
        });

        // Generate CSV
        let csv = 'Team,Player Name,Role,Sold Price\n';
        players.forEach(p => {
            const teamName = p.Team ? p.Team.name : 'Unknown';
            const playerName = p.Player ? p.Player.name : 'Unknown';
            const role = p.Player ? p.Player.role : 'N/A';
            csv += `"${teamName}","${playerName}","${role}",${p.sold_price}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`squads_auction_${id}.csv`);
        res.send(csv);

    } catch (error) {
        console.error("Error exporting squads:", error);
        res.status(500).json({ message: 'Error exporting squads' });
    }
};

// Export Logs (CSV)
exports.exportLogs = async (req, res) => {
    try {
        const { id } = req.params; // Auction ID

        // We use AuctionPlayer 'updatedAt' as a proxy for sale time if we don't have a specific Transaction log.
        // Or we can use the Bid table if we want bid logs, but request asked for 'Transaction logs' (likely final sales).

        const sales = await AuctionPlayer.findAll({
            where: { auction_id: id, status: 'Sold' },
            include: [
                { model: Player, attributes: ['name'] },
                { model: Team, attributes: ['name'] }
            ],
            order: [['updatedAt', 'ASC']] // Chronological order of sale
        });

        let csv = 'Time,Player Name,Bought By,Amount\n';
        sales.forEach(s => {
            const time = new Date(s.updatedAt).toLocaleString();
            const playerName = s.Player ? s.Player.name : 'Unknown';
            const teamName = s.Team ? s.Team.name : 'Unknown';
            csv += `"${time}","${playerName}","${teamName}",${s.sold_price}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`transaction_log_auction_${id}.csv`);
        res.send(csv);

    } catch (error) {
        console.error("Error exporting logs:", error);
        res.status(500).json({ message: 'Error exporting logs' });
    }
};
