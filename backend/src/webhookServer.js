// webhookServer.js
const http = require('http');
const stripe = require('../utils/stripe');
const crypto = require('crypto');
const url = require('url');

// Create raw HTTP server
const server = http.createServer(async (req, res) => {
  const pathname = url.parse(req.url).pathname;

  // Log request info
  console.log('\n=== Webhook Request ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);

  // Only handle POST requests to correct path
  if (req.method !== 'POST' || pathname !== '/api/webhooks/webhook') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  // Get stripe signature
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'No stripe-signature header' }));
  }

  try {
    // Collect request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // Log body details
    console.log('\n=== Request Body ===');
    console.log('Body type:', typeof rawBody);
    console.log('Is Buffer:', Buffer.isBuffer(rawBody));
    console.log('Body length:', rawBody.length);
    console.log('Body preview:', rawBody.slice(0, 50).toString());

    // Verify the event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('\n=== Event ===');
    console.log('Type:', event.type);
    console.log('ID:', event.id);

    // Handle based on event type
    switch (event.type) {
      case 'payment_intent.succeeded':
        const payment = event.data.object;
        console.log('Payment succeeded:', payment.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    console.error('\n=== Error ===');
    console.error('Type:', err.constructor.name);
    console.error('Message:', err.message);
    if (err.stack) console.error('Stack:', err.stack);

    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

// Listen on port 5001
const WEBHOOK_PORT = 5001;
server.listen(WEBHOOK_PORT, '127.0.0.1', () => {
  console.log(`Webhook server listening on port ${WEBHOOK_PORT}`);
  console.log('Stripe webhook secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

module.exports = server;
