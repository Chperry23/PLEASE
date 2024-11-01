const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const validateRawBody = (req, res, next) => {
  if (!Buffer.isBuffer(req.body)) {
    console.error('Request body is not a buffer:', typeof req.body);
    return res.status(400).send('Invalid request body format');
  }
  next();
};

router.post('/', validateRawBody, async (req, res) => {
  console.log('Received webhook at:', new Date().toISOString());
  
  // Log request details
  console.log('Protocol:', req.protocol);
  console.log('X-Forwarded-Proto:', req.get('x-forwarded-proto'));
  console.log('Original URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  
  const sig = req.headers['stripe-signature'];
  
  // Validate webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log('Webhook secret first 4 chars:', webhookSecret?.substring(0, 4));
  
  if (!sig || !webhookSecret) {
    console.error('Missing required webhook configuration');
    return res.status(400).send('Missing webhook configuration');
  }

  try {
    // Log raw body details
    console.log('Raw body length:', req.body.length);
    console.log('Raw body type:', typeof req.body);
    console.log('Is Buffer:', Buffer.isBuffer(req.body));
    console.log('Content-Type:', req.get('content-type'));
    
    // Do not attempt to parse or transform the body
    const event = stripe.webhooks.constructEvent(
      req.body, // Must be raw buffer
      sig,
      webhookSecret
    );

    console.log('Event validated successfully:', event.type);

    switch (event.type) {
      case 'charge.updated':
        console.log('Processing charge update:', event.data.object.id);
        break;
      case 'checkout.session.completed':
        console.log('Processing checkout completion:', event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Processing Error:', {
      message: err.message,
      stack: err.stack,
      signatureHeader: sig,
      bodyIsBuffer: Buffer.isBuffer(req.body),
      bodyLength: req.body?.length,
      protocol: req.protocol,
      forwardedProto: req.get('x-forwarded-proto'),
      webhookSecretLength: webhookSecret?.length
    });

    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router
