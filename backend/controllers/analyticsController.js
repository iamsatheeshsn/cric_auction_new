const { Team, Player, Auction, AuctionPlayer, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAuctionAnalytics = async (req, res) => {
    try {
        console.log("Fetching Analytics...");
        const { auction_id } = req.query;
        const filter = auction_id ? { auction_id } : {};

        // 1. Budget Stats via AuctionPlayer
        const teams = await Team.findAll({
            where: filter,
            attributes: ['id', 'name', 'purse_remaining', 'short_name', 'image_path'],
            include: [{
                model: AuctionPlayer,
                // as: 'SoldPlayers', // Remove alias if not defined in associations
                where: { status: 'Sold' },
                required: false,
                include: [Player]
            }]
        });

        const budgetStats = teams.map(team => {
            // sold_price is now on AuctionPlayer
            const spent = (team.AuctionPlayers || []).reduce((sum, ap) => sum + (ap.sold_price || 0), 0);
            return {
                id: team.id,
                name: team.short_name || team.name,
                full_name: team.name, // Added full_name for table
                image_path: team.image_path,
                budget: (team.purse_remaining || 0) + spent,
                spent: spent,
                remaining: team.purse_remaining,
                playerCount: (team.AuctionPlayers || []).length
            };
        });

        // 2. Role Distribution via AuctionPlayer -> Player
        // We need to count roles of players in THIS auction
        const roleStatsCount = await AuctionPlayer.findAll({
            where: filter,
            include: [{ model: Player, attributes: ['role'] }],
            raw: true
        });

        // Manual Grouping since Player.role is nested
        const roleCounts = {};
        roleStatsCount.forEach(ap => {
            const r = ap['Player.role']; // flat key from raw:true
            if (r) {
                roleCounts[r] = (roleCounts[r] || 0) + 1;
            }
        });

        const roleStats = Object.keys(roleCounts).map(role => ({
            role,
            count: roleCounts[role]
        }));


        // 3. Status Distribution via AuctionPlayer
        const statusStats = await AuctionPlayer.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: filter,
            group: ['status']
        });

        res.json({
            budgetStats,
            roleStats,
            statusStats,
            squadAnalysis: teams.map(team => {
                const players = team.AuctionPlayers || [];
                // Role Counts
                const roles = {
                    batsman: 0,
                    bowler: 0,
                    allRounder: 0,
                    wicketKeeper: 0
                };
                players.forEach(ap => {
                    const r = ap.Player ? ap.Player.role.toLowerCase() : '';
                    if (r.includes('bat')) roles.batsman++;
                    if (r.includes('bowl')) roles.bowler++;
                    if (r.includes('all')) roles.allRounder++;
                    if (r.includes('keeper') || r.includes('wk')) roles.wicketKeeper++;
                });

                const totalPlayers = players.length;

                // Ratings Logic (Simple Heuristic for Demo)
                // Batting: (Batsman * 2 + AllRounder * 1 + WK * 1) / (Ideal 7) * 10
                // Bowling: (Bowler * 2 + AllRounder * 1) / (Ideal 6) * 10
                const battingScore = (roles.batsman * 2 + roles.allRounder * 1.5 + roles.wicketKeeper * 1);
                const bowlingScore = (roles.bowler * 2 + roles.allRounder * 1.5);

                // Normaize to 10 scale (assuming avg squad calculation)
                const battingRating = Math.min(10, Math.round((battingScore / 15) * 10));
                const bowlingRating = Math.min(10, Math.round((bowlingScore / 12) * 10));

                const insights = [];
                if (roles.wicketKeeper === 0) insights.push({ type: 'weakness', text: "No Wicket Keeper" });
                if (roles.bowler < 3) insights.push({ type: 'weakness', text: "Light on specialized bowlers" });
                if (roles.batsman < 3) insights.push({ type: 'weakness', text: "Weak core batting" });
                if (roles.allRounder > 3) insights.push({ type: 'strength', text: "Strong All-rounder depth" });
                if (totalPlayers < 11) insights.push({ type: 'warning', text: "Squad incomplete (<11)" });

                return {
                    teamId: team.id,
                    teamName: team.name,
                    teamImage: team.image_path,
                    roles,
                    ratings: {
                        batting: battingRating || 0,
                        bowling: bowlingRating || 0
                    },
                    insights
                };
            })
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Error fetching analytics" });
    }
};

exports.getSquadAnalysis = async (req, res) => {
    try {
        const { auctionId, teamId } = req.params;

        // Fetch Team with Players
        const team = await Team.findOne({
            where: { id: teamId },
            include: [{
                model: AuctionPlayer,
                where: { auction_id: auctionId, status: 'Sold' },
                include: [{ model: Player }]
            }]
        });

        if (!team) return res.status(404).json({ message: "Team not found" });

        const players = team.AuctionPlayers.map(ap => ap.Player);
        const totalPlayers = players.length;

        if (totalPlayers === 0) {
            return res.json({
                balance: { stars: 0, batsmen: 0, bowlers: 0, allRounders: 0, wks: 0 },
                ratings: { batting: 0, bowling: 0, overall: 0 },
                insights: ["Squad is empty."]
            });
        }

        // 1. Roles Count
        let bat = 0, bowl = 0, ar = 0, wk = 0;
        let pace = 0, spin = 0;

        players.forEach(p => {
            const role = p.role?.toLowerCase() || '';
            const bowlType = p.bowling_type?.toLowerCase() || '';

            if (role.includes('batsman')) bat++;
            if (role.includes('bowler')) bowl++;
            if (role.includes('all rounder') || role.includes('all-rounder')) ar++;
            if (role.includes('wicket keeper') || role.includes('keeper')) wk++;

            if (bowlType.includes('spin')) spin++;
            if (bowlType.includes('pace') || bowlType.includes('fast') || bowlType.includes('medium')) pace++;
        });

        // 2. Ratings Logic (Simple Heuristic)
        // Rating out of 10. 
        // Ideal: 6 Batsmen, 5 Bowlers (inc ARs). 

        // Effective Batting Count = Batsmen + All Rounders + WKs
        const effectiveBat = bat + ar + wk;
        const batRating = Math.min(10, Math.round((effectiveBat / 7) * 10)); // Target ~7 batting options

        // Effective Bowling Count = Bowlers + All Rounders
        const effectiveBowl = bowl + ar;
        const bowlRating = Math.min(10, Math.round((effectiveBowl / 6) * 10)); // Target ~6 bowling options

        const overallRating = Math.round((batRating + bowlRating) / 2);

        // 3. Insights
        const insights = [];

        if (spin === 0) insights.push("⚠️ Weakness: No specialized Spinner found.");
        else if (spin >= 3) insights.push("✅ Strength: Strong Spin Attack.");

        if (pace === 0) insights.push("⚠️ Weakness: Lack of Pace Bowlers.");

        if (wk === 0) insights.push("⚠️ Critical: No Wicket Keeper in squad.");
        else if (wk >= 2) insights.push("ℹ️ Depth: Multiple Wicket Keepers available.");

        if (ar >= 3) insights.push("🔥 Strength: Excellent All-Rounder depth provides balance.");
        if (ar === 0) insights.push("⚠️ Observe: Lack of All-Rounders may affect balance.");

        if (batRating >= 8) insights.push("💪 Powerhouse: Very strong batting lineup.");
        if (bowlRating >= 8) insights.push("🛡️ Fortress: Deep bowling attack.");

        res.json({
            teamName: team.name,
            totalPlayers,
            composition: {
                batsmen: bat,
                bowlers: bowl,
                allRounders: ar,
                wicketKeepers: wk
            },
            ratings: {
                batting: batRating,
                bowling: bowlRating,
                overall: overallRating
            },
            insights
        });

    } catch (error) {
        console.error("Squad Analysis Error:", error);
        res.status(500).json({ message: "Error analyzing squad" });
    }
};
