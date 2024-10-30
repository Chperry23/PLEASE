const axios = require('axios');

async function testFlow() {
  try {
    console.log('Testing registration...');
    const registerResponse = await axios.post('https://autolawn.app/api/auth/register', {
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: 'Test123!'
    });
    
    console.log('Registration successful:', registerResponse.data);
    const token = registerResponse.data.token;

    console.log('\nTesting user route...');
    const userResponse = await axios.get('https://autolawn.app/api/user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('User data:', userResponse.data);

    console.log('\nTesting subscription route...');
    const subscriptionResponse = await axios.get('https://autolawn.app/api/subscription/details', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Subscription data:', subscriptionResponse.data);

  } catch (error) {
    console.error('Test error:', {
      message: error.message,
      response: error.response?.data
    });
  }
}

testFlow();
