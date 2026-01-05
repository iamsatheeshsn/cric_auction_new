const axios = require('axios');

async function checkAuctionStatus() {
    try {
        const response = await axios.get('http://localhost:5000/api/auctions');
        const auctions = response.data.auctions || response.data;

        console.log("Total Auctions:", auctions.length);
        auctions.forEach(a => {
            console.log(`ID: ${a.id}, Name: ${a.name}, Status: '${a.status}'`);
        });
    } catch (error) {
        console.error("Error fetching auctions:", error.message);
    }
}

checkAuctionStatus();
