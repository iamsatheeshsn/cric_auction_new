const axios = require('axios');

async function verifyFixture() {
    try {
        const response = await axios.get('http://localhost:5000/api/calendar');
        const matches = response.data.filter(e => e.type === 'match');

        console.log(`Found ${matches.length} matches.`);

        if (matches.length > 0) {
            // Log the first match
            console.log('--- Sample Match ---');
            console.log(JSON.stringify(matches[0], null, 2));

            // Log a completed match if one exists
            const completed = matches.find(m => m.status === 'Completed');
            if (completed) {
                console.log('--- Completed Match ---');
                console.log(JSON.stringify(completed, null, 2));
            } else {
                console.log('No completed matches found to verify results.');
            }
        }
    } catch (error) {
        console.error(error);
    }
}

verifyFixture();
