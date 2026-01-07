const io = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

const verify = async () => {
    console.log('Starting Verification...');

    // 1. Setup Socket Client
    const socket = io(SOCKET_URL);

    await new Promise(resolve => socket.on('connect', resolve));
    console.log('Socket Connected:', socket.id);

    // 2. Test Auction Room Chat
    console.log('\n--- Testing Auction Room Chat ---');
    socket.emit('join_room', 'auction_1');

    // Send Message
    const auctionMsg = {
        auctionId: 1,
        userId: 1, // Assuming admin user exists
        content: 'Test Auction Message ' + Date.now(),
        type: 'auction_room'
    };
    socket.emit('send_message', auctionMsg);
    console.log('Sent Auction Message');

    // 3. Test Match Center Chat
    console.log('\n--- Testing Match Center Chat ---');
    const fixtureId = 999;
    socket.emit('join_room', `match_${fixtureId}`);

    const matchMsg = {
        auctionId: 1,
        userId: 1,
        content: 'Test Match Message ' + Date.now(),
        type: 'match_center',
        fixtureId: fixtureId
    };
    socket.emit('send_message', matchMsg);
    console.log('Sent Match Message');

    // Wait for DB save
    await new Promise(r => setTimeout(r, 2000));

    // 4. Verify API Retrieval
    console.log('\n--- Verifying API Retrieval ---');

    try {
        // Fetch Auction Messages
        const resAuction = await axios.get(`${API_URL}/chat/1?type=auction_room`);
        const foundAuction = resAuction.data.find(m => m.content === auctionMsg.content);
        if (foundAuction && foundAuction.type === 'auction_room') {
            console.log('✅ Auction Message Found via API');
        } else {
            console.error('❌ Auction Message NOT Found or Wrong Type', foundAuction);
            console.log('DEBUG: Received Auction Msgs:', JSON.stringify(resAuction.data, null, 2));
        }

        // Fetch Match Messages
        const resMatch = await axios.get(`${API_URL}/chat/1?type=match_center&fixtureId=${fixtureId}`);
        const foundMatch = resMatch.data.find(m => m.content === matchMsg.content);
        if (foundMatch && foundMatch.type === 'match_center' && foundMatch.fixture_id == fixtureId) {
            console.log('✅ Match Message Found via API');
        } else {
            console.error('❌ Match Message NOT Found or Wrong Type', foundMatch);
            console.log('DEBUG: Received Match Msgs:', JSON.stringify(resMatch.data, null, 2));
            // Debug: what did we get?
            // console.log('Received:', resMatch.data);
        }

        // Verify Cross-Pollination (Match msg shouldn't be in Auction list)
        // Note: The simple GET /chat/:id defaults to type=auction_room in our Logic?
        // Let's check the default behavior logic we wrote.
        // if type is NOT match_center, it forces auction_room.
        // So fetching /chat/1 should NOT return match messages.

        const resDefault = await axios.get(`${API_URL}/chat/1`);
        const crossCheck = resDefault.data.find(m => m.content === matchMsg.content);
        if (!crossCheck) {
            console.log('✅ Match Message NOT visible in default Auction Chat');
        } else {
            console.error('❌ Match Message LEAKED into Auction Chat');
        }

    } catch (err) {
        console.error('API Verification Failed:', err.message);
    }

    socket.disconnect();
    process.exit(0);
};

verify();
