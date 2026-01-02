const axios = require('axios');

async function checkHistory() {
    try {
        console.log("Checking History API...");

        // 1. Tournaments
        try {
            const tournaments = await axios.get('http://localhost:5000/api/history/tournaments');
            console.log("Tournaments API: OK", "Count:", tournaments.data.length);
            if (tournaments.data.length > 0) {
                console.log("Sample:", tournaments.data[0].name, "| Winner:", tournaments.data[0].Winner?.name);
            }
        } catch (e) {
            console.error("Tournaments API Failed:", e.message);
        }

        // 2. Hall of Fame
        try {
            const hof = await axios.get('http://localhost:5000/api/history/hall-of-fame');
            console.log("Hall of Fame API: OK");
            console.log("Most Expensive:", hof.data.mostExpensive?.player?.name, hof.data.mostExpensive?.price, "Img:", hof.data.mostExpensive?.player?.image_path);
            console.log("Top Bat:", hof.data.topBatsman?.player?.name, hof.data.topBatsman?.runs, "Img:", hof.data.topBatsman?.player?.image_path);
            console.log("Top Bowl:", hof.data.topBowler?.player?.name, hof.data.topBowler?.wickets, "Img:", hof.data.topBowler?.player?.image_path);
        } catch (e) {
            console.error("Hall of Fame API Failed:", e.message);
        }

    } catch (error) {
        console.error("General Error:", error);
    }
}

checkHistory();
