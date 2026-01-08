const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

const upload = require('../middleware/upload');

console.log("Loading Team Routes...");

// Create Team (with image upload)
router.post('/', upload.single('image'), teamController.createTeam);

// Update Team
router.put('/:id', upload.single('image'), teamController.updateTeam);

// Get Teams by Auction
router.get('/auction/:auctionId', teamController.getTeamsByAuction);

// Get All Teams by Auction
router.get('/all/:auctionId', teamController.getAllTeams);

// Get Wallet Details
router.get('/:id/wallet', teamController.getTeamWalletDetails);

// Delete Team
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
