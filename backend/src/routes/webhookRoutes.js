// webhookRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');

router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    console.log('\n=== Webhook Request ===');
    console.log('Headers:', req.headers);
    
    // Validate stripe signature header exists
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error('Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify we have a body
    if (!req.body) {
      console.error('Missing request body');
      return res.status(400).json({ error: 'Missing request body' });
    }

    // Debug body
    console.log('\n=== Request Body ===');
    console.log('Body type:', typeof req.body);
    console.log('Is Buffer:', Buffer.isBuffer(req.body));
    console.log('Body length:', req.body.length);
    console.log('Body preview (hex):', req.body.slice(0, 50).toString('hex'));
    console.log('Body preview (utf8):', req.body.slice(0, 50).toString('utf8'));

    // Debug signature
    console.log('\n=== Signature Details ===');
    const sigParts = sig.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});
    console.log('Signature parts:', sigParts);
    console.log('Timestamp:', sigParts.t);
    console.log('v1 signature:', sigParts.v1?.substring(0, 20) + '...');

    // Verify event
    console.log('\n=== Verifying Event ===');
    console.log('Secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length);
    console.log('Secret prefix:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7));
    
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Event verified:', event.type);
    console.log('Event ID:', event.id);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Processing payment_intent:', paymentIntent.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('\n=== Webhook Error ===');
    console.error('Error Type:', err.constructor.name);
    console.error('Error Message:', err.message);
    console.error('Stack:', err.stack);

    // Additional debug info if we have a body
    if (req.body) {
      console.error('Body Hash:', require('crypto')
        .createHash('md5')
        .update(req.body)
        .digest('hex')
      );
    }

    res.status(400).json({ 
      error: err.message,
      type: err.constructor.name
    });
  }
});

module.exports = router;
