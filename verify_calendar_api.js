const axios = require('axios');

async function verifyCalendarApi() {
    try {
        console.log('Testing /api/calendar endpoint...');
        const response = await axios.get('http://localhost:5000/api/calendar');

        if (response.status === 200) {
            console.log('✅ Calendar API request successful');
            console.log(`Received ${response.data.length} events`);

            if (response.data.length > 0) {
                console.log('Sample Event:', JSON.stringify(response.data[0], null, 2));

                // Validate structure
                const event = response.data[0];
                if (event.id && event.title && event.start && event.type) {
                    console.log('✅ Event structure is correct');
                } else {
                    console.error('❌ Event structure is missing required fields');
                }
            } else {
                console.warn('⚠️ No events returned. This might be correct if database is empty.');
            }
        } else {
            console.error(`❌ API request failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ API Verification Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
        }
    }
}

verifyCalendarApi();
