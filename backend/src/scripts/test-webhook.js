const axios = require('axios');

async function testWebhook() {
  try {
    const response = await axios.post('https://autolawn.app/api/webhooks/test', {
      type: 'test.webhook',
      data: {
        object: {
          id: 'test_123',
          customer: 'cus_test123',
          status: 'active'
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Webhook test response:', response.data);
  } catch (error) {
    console.error('Webhook test error:', error.response?.data || error.message);
  }
}

testWebhook();
