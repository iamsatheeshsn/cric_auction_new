const axios = require('axios');

const API_URL = 'http://127.0.0.1:5001/api';

async function runVerification() {
    console.log("--- Starting User Profile & Activity Log Verification ---");

    try {
        // 1. Login
        console.log("1. Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: '123456' // Default from seed_data.js
        });
        const { token, user } = loginRes.data;
        const userId = user.id;
        console.log(`   Logged in as ${user.username} (ID: ${userId})`);

        // 2. Update Profile
        console.log("\n2. Updating Profile...");
        const newName = `Admin User ${Date.now()}`;
        const newAvatar = `https://example.com/avatar_${Date.now()}.png`;

        await axios.post(`${API_URL}/auth/update-profile`, {
            userId,
            display_name: newName,
            avatar: newAvatar
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`   Profile updated: Name=${newName}`);

        // 3. Create Auction (to test other activity)
        console.log("\n3. Creating Auction (to trigger activity)...");
        const auctionRes = await axios.post(`${API_URL}/auctions`, {
            name: `Activity Test Auction ${Date.now()}`,
            auction_date: new Date(),
            userId: userId,
            place: 'Test Place',
            type: 'Professional',
            points_per_team: 10000,
            min_bid: 100,
            bid_increase_by: 50
        });
        console.log(`   Auction created: ID ${auctionRes.data.id}`);

        // 4. Fetch Activity Log
        console.log("\n4. Fetching Activity Log...");
        const activityRes = await axios.get(`${API_URL}/activity/${userId}`);
        const logs = activityRes.data;

        console.log(`   Fetched ${logs.length} logs.`);

        const profileLog = logs.find(l => l.action === "Updated Profile");
        const auctionLog = logs.find(l => l.action === "Created Auction");

        if (profileLog) {
            console.log("   [PASS] Found 'Updated Profile' log.");
        } else {
            console.error("   [FAIL] Missing 'Updated Profile' log.");
        }

        if (auctionLog) {
            console.log("   [PASS] Found 'Created Auction' log.");
        } else {
            console.error("   [FAIL] Missing 'Created Auction' log.");
        }

    } catch (error) {
        console.error("Verification Failed:", error.message);
        if (error.code) console.error("Error Code:", error.code);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
}

runVerification();
