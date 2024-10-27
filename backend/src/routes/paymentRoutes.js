// routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Ensure Stripe is initialized correctly

// Endpoint to create a Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  const { priceId, userId } = req.body;

  if (!priceId || !userId) {
    return res.status(400).json({ error: 'Price ID and User ID are required.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating Checkout session:', error);
    res.status(500).json({ error: 'An error occurred while creating the session.' });
  }
});

module.exports = router;
