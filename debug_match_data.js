const axios = require('axios');

async function debugMatchData() {
    try {
        const response = await axios.get('http://localhost:5000/api/score/match/4'); // Match 4
        const data = response.data;

        console.log("=== Fixture Status ===");
        console.log("Status:", data.fixture?.status);
        console.log("Teams:", data.fixture?.Team1?.short_name, "vs", data.fixture?.Team2?.short_name);
        console.log("Current State IDs:", {
            striker: data.fixture?.striker_id,
            nonStriker: data.fixture?.non_striker_id,
            bowler: data.fixture?.bowler_id
        });

        console.log("\n=== Balls Data ===");
        console.log("Count:", data.balls?.length);
        if (data.balls?.length > 0) {
            console.log("First Ball:", JSON.stringify(data.balls[0], null, 2));
        }

        console.log("\n=== Win Prob ===");
        console.log(data.winProbability);

        console.log("\n=== Players Check ===");
        if (data.fixture?.Team1?.Players?.length > 0) {
            console.log("Team 1 First Player:", JSON.stringify(data.fixture.Team1.Players[0], null, 2));
        }

    } catch (error) {
        console.error("API Error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

debugMatchData();
