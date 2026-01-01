const { io } = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

console.log("--- Starting Feature Verification ---");

// 1. Test Socket Connection
const socket = io(SOCKET_URL);
let bidReceived = false;

socket.on('connect', () => {
    console.log("✅ Socket Connected successfully:", socket.id);

    // Trigger a bid to test real-time update
    triggerBid();
});

socket.on('connect_error', (err) => {
    console.error("❌ Socket Connection Error:", err.message);
});

socket.on('bid_updated', (data) => {
    console.log("✅ Received 'bid_updated' event:", data);
    bidReceived = true;

    if (data.amount === 999999) {
        console.log("✅ Real-time Bidding Verified!");
    }
});

async function triggerBid() {
    try {
        console.log("Testing Bid API...");
        // Assuming auction 10 exists (referenced by user). We will try to update a bid.
        // We need a valid team ID. Let's fetch teams first.
        const teamsRes = await axios.get(`${API_URL}/teams/auction/10`);
        const teams = teamsRes.data.teams;

        if (teams && teams.length > 0) {
            const bidder = teams[0];
            console.log(`Placing test bid for team: ${bidder.name} (${bidder.id})`);

            await axios.put(`${API_URL}/auctions/10/live-bid`, {
                amount: 999999, // Unique amount to verify
                bidderId: bidder.id
            });
            console.log("✅ Bid API Request Sent");
        } else {
            console.warn("⚠️ No teams found to place a bid.");
        }
    } catch (error) {
        console.error("❌ Bid API Error:", error.message);
    }

    testStrategyDashboard();
}

async function testStrategyDashboard() {
    console.log("\nTesting Strategy Dashboard APIs...");
    try {
        // Test Shortlist API
        // 1. Add item
        const teamsRes = await axios.get(`${API_URL}/teams/auction/10`);
        if (teamsRes.data.teams.length > 0) {
            const teamId = teamsRes.data.teams[0].id;

            // Get a player
            const playersRes = await axios.get(`${API_URL}/players/auction/10`);
            if (playersRes.data.players.length > 0) {
                const player = playersRes.data.players[0];

                console.log(`Adding player ${player.name} to shortlist for team ${teamId}...`);

                try {
                    const addRes = await axios.post(`${API_URL}/shortlist`, {
                        team_id: teamId,
                        player_id: player.id,
                        priority: 1
                    });
                    console.log("✅ Add to Shortlist: Success", addRes.data.id);
                } catch (e) {
                    if (e.response && e.response.status === 400) {
                        console.log("⚠️ Player probably already in shortlist.");
                    } else {
                        throw e;
                    }
                }

                // 2. Fetch Shortlist (Always try this)
                const listRes = await axios.get(`${API_URL}/shortlist/${teamId}`);
                if (listRes.data.length > 0) {
                    console.log(`✅ Fetch Shortlist: Success (Found ${listRes.data.length} items)`);

                    // 3. Try to remove the FIRST item (to clean up)
                    await axios.delete(`${API_URL}/shortlist/${listRes.data[0].id}`);
                    console.log("✅ Remove from Shortlist: Success");
                } else {
                    console.error("❌ Fetch Shortlist: Returned empty list");
                }
            }
        }
    } catch (error) {
        console.error("❌ Strategy Dashboard Verify Error:", error.message);
    }

    // Cleanup
    setTimeout(() => {
        if (!bidReceived) console.error("❌ Did NOT receive socket event within timeout.");
        socket.close();
        console.log("\n--- Verification Complete ---");
    }, 3000);
}
