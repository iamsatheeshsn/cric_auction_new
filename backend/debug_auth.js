const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function testAuth() {
    console.log("--- Auth Debugger ---");
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("CRITICAL: JWT_SECRET is missing from .env");
        return;
    }
    console.log("JWT_SECRET found (length):", secret.length);

    // 1. Generate a Fresh Token
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, secret, { expiresIn: '1h' });
    console.log("Generated Fresh Token:", token.substring(0, 20) + "...");

    // 2. Try to Access Notifications
    try {
        console.log("Attempting GET /api/notifications...");
        const res = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS! Status:", res.status);
        console.log("Data:", res.data.length, "notifications found.");
        if (res.data.length > 0) {
            console.log("First Notification Sample:", JSON.stringify(res.data[0], null, 2));
        }
    } catch (error) {
        console.error("FAILED GET /api/notifications");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testAuth();
