const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const AUCTION_ID = 10;

async function testRevisit() {
    try {
        console.log("--- Testing Revisit Player ---");

        // 1. Get an Unsold Player (we just marked one as unsold in the previous step)
        console.log("Fetching unsold players...");
        const response = await axios.get(`${API_URL}/players/auction/${AUCTION_ID}`);
        // Assuming the API returns { players: [...] } or just [...]
        const players = response.data.players || response.data;

        // Find a player with status 'Unsold'
        const unsoldPlayer = players.find(p => p.status === 'Unsold');

        if (!unsoldPlayer) {
            console.error("❌ No Unsold players found to test revisit.");
            return;
        }

        console.log(`Found Unsold Player: ${unsoldPlayer.name} (ID: ${unsoldPlayer.id})`);

        // 2. Attempt api.put generic with auction_id
        console.log(`Attempting to Revisit (Bring back to pool) player ${unsoldPlayer.id}...`);

        const revisitRes = await axios.put(`${API_URL}/players/${unsoldPlayer.id}/revisit`, {
            auction_id: AUCTION_ID
        });

        console.log("✅ Revisit Response:", revisitRes.data);

        // 3. Verify status is now 'Available'
        // We can check the response 'player' object or refetch
        if (revisitRes.data.player.status === 'Available') {
            console.log("✅ Verification Successful: Player status is now 'Available'");
        } else {
            console.error("❌ Verification Failed: Player status is", revisitRes.data.player.status);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
}

testRevisit();
