const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// Using Auction ID 10 as per user report, and a dummy player ID (assuming one exists or I will create/fetch one)

async function testUnsold() {
    try {
        console.log("--- Testing Mark Unsold ---");

        // 1. Fetch unsold players for Auction 10
        console.log("Fetching players for auction 10...");
        const playersRes = await axios.get(`${API_URL}/players/auction/10`);
        const unsoldPlayers = playersRes.data.players.filter(p => !p.Team); // Assuming Team null means unsold/available

        if (unsoldPlayers.length === 0) {
            console.error("No available players found in auction 10 to test with.");
            return;
        }

        const player = unsoldPlayers[0];
        console.log(`Found player: ${player.name} (ID: ${player.id})`);

        // 2. Try to mark as unsold
        console.log(`Attempting to mark player ${player.id} as UNSOLD...`);
        try {
            const res = await axios.post(`${API_URL}/players/${player.id}/unsold`, {
                auction_id: 10
            });
            console.log("✅ Success:", res.data);
        } catch (postErr) {
            console.error("❌ Failed:", postErr.message);
            if (postErr.response) {
                console.error("Status:", postErr.response.status);
                console.error("Data:", postErr.response.data);
            }
        }

    } catch (error) {
        console.error("Global Error:", error.message);
    }
}

testUnsold();
