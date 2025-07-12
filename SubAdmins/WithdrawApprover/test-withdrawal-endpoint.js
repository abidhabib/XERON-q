const axios = require('axios');

async function testEndpoint() {
  try {
    const response = await axios.get('http://localhost:5000/api/withdrawal-requests', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Error testing endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
     
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEndpoint();
