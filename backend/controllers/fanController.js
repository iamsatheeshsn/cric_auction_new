const { Prediction, FantasyTeam, FantasyPlayer, Fixture, Player, Team, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- PREDICTIONS ---

exports.submitPrediction = async (req, res) => {
    try {
        const { fixtureId, predictedWinnerId, predictedScore } = req.body;
        const userId = req.user.id; // Using auth middleware

        // 1. Check if match has started
        const fixture = await Fixture.findByPk(fixtureId);
        if (!fixture) return res.status(404).json({ message: "Fixture not found" });

        /* 
        // Logic to block if match started. Assuming date is in fixture.
        // For now, allow anytime for demo.
        if (new Date(fixture.date) < new Date()) {
             return res.status(400).json({ message: "Match already started" });
        }
        */

        // 2. Check if already predicted
        const existing = await Prediction.findOne({ where: { user_id: userId, fixture_id: fixtureId } });
        if (existing) {
            existing.predicted_winner_id = predictedWinnerId;
            existing.predicted_score = predictedScore;
            await existing.save();
            return res.json({ message: "Prediction updated", prediction: existing });
        }

        const prediction = await Prediction.create({
            user_id: userId,
            fixture_id: fixtureId,
            predicted_winner_id: predictedWinnerId,
            predicted_score: predictedScore
        });

        res.json({ message: "Prediction submitted", prediction });

    } catch (error) {
        console.error("Prediction Error:", error);
        res.status(500).json({ message: "Error submitting prediction" });
    }
};

exports.getMyPredictions = async (req, res) => {
    try {
        const userId = req.user.id;
        const predictions = await Prediction.findAll({
            where: { user_id: userId },
            include: [
                { model: Fixture, include: [{ model: Team, as: 'Team1' }, { model: Team, as: 'Team2' }] },
                { model: Team, as: 'PredictedWinner' }
            ]
        });
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching predictions" });
    }
};

// --- FANTASY TEAMS ---

exports.createFantasyTeam = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { auctionId, fixtureId, teamName, playerIds } = req.body; // fixtureId added
        const userId = req.user.id;

        if (!playerIds || playerIds.length === 0 || playerIds.length > 11) {
            return res.status(400).json({ message: "You must select between 1 and 11 players." });
        }

        // Check if user already has a team for this match (fixture)
        const existing = await FantasyTeam.findOne({ where: { user_id: userId, fixture_id: fixtureId } });
        if (existing) {
            return res.status(400).json({ message: "You already have a fantasy team for this match." });
        }

        const fantasyTeam = await FantasyTeam.create({
            user_id: userId,
            auction_id: auctionId,
            fixture_id: fixtureId,
            team_name: teamName
        }, { transaction: t });

        const fantasyPlayers = playerIds.map(pid => ({
            fantasy_team_id: fantasyTeam.id,
            player_id: pid
        }));

        await FantasyPlayer.bulkCreate(fantasyPlayers, { transaction: t });

        await t.commit();
        res.json({ message: "Fantasy Team Created!", team: fantasyTeam });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error creating fantasy team", error: error.message });
    }
};

exports.getMyFantasyTeam = async (req, res) => {
    try {
        const { auctionId, fixtureId } = req.query; // fixtureId required now
        const userId = req.user.id;

        if (!fixtureId) return res.status(400).json({ message: "Fixture ID is required" });

        const team = await FantasyTeam.findOne({
            where: { user_id: userId, fixture_id: fixtureId },
            include: [
                {
                    model: FantasyPlayer,
                    include: [{ model: Player }] // Fetch player details
                }
            ]
        });

        if (!team) return res.json({ team: null });
        res.json({ team });

    } catch (error) {
        res.status(500).json({ message: "Error fetching fantasy team" });
    }
};
