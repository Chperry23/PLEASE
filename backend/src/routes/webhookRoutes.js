const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const crypto = require('crypto');

// Raw body parser
const rawParser = express.raw({
  type: 'application/json',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
});

router.post('/', rawParser, async (req, res) => {
  try {
    console.log('\n=== Webhook Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // Debug request details
    console.log('\n=== Request Details ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Remote IP:', req.ip);
    console.log('Original URL:', req.originalUrl);

    // Get stripe signature
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error('No stripe signature found');
      return res.status(400).json({ error: 'No stripe signature found' });
    }

    // Debug body details
    const rawBody = req.rawBody;
    console.log('\n=== Body Details ===');
    console.log('Raw body exists:', !!rawBody);
    console.log('Is Buffer:', Buffer.isBuffer(rawBody));
    console.log('Length:', rawBody?.length);
    console.log('Hash:', crypto.createHash('sha256').update(rawBody).digest('hex'));

    // Debug signature
    console.log('\n=== Signature Details ===');
    console.log('Raw signature:', sig);
    const sigParts = sig.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});
    console.log('Signature parts:', sigParts);

    // Debug webhook secret
    console.log('\n=== Webhook Configuration ===');
    console.log('Secret exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length);

    // Verify the event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('\n=== Event Verified ===');
    console.log('Type:', event.type);
    console.log('ID:', event.id);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const payment = event.data.object;
        console.log('Payment succeeded:', {
          id: payment.id,
          amount: payment.amount,
          status: payment.status
        });
        break;

      case 'payment_intent.created':
        console.log('Payment created:', event.data.object.id);
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        console.log('Charge succeeded:', {
          id: charge.id,
          amount: charge.amount,
          status: charge.status
        });
        break;

      case 'charge.updated':
        const updatedCharge = event.data.object;
        console.log('Charge updated:', {
          id: updatedCharge.id,
          status: updatedCharge.status
        });
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({
      received: true,
      type: event.type,
      id: event.id
    });
  } catch (err) {
    console.error('\n=== Webhook Error ===');
    console.error('Error Type:', err.constructor.name);
    console.error('Error Message:', err.message);
    console.error('Stack:', err.stack);

    res.status(400).json({
      error: err.message,
      type: err.constructor.name
    });
  }
});

module.exports = router;
