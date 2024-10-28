const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');

// Get all prices/products
router.get('/prices', async (req, res) => {
  try {
    // Return hardcoded product information
    const products = [
      {
        id: 'prod_R2TeQ4r5iOH6CG',
        name: 'Basic',
        unit_amount: 4999, // $49.99
        recurring: { interval: 'month' },
        paymentLink: 'https://buy.stripe.com/00gaGf36G05W84EeUU'
      },
      {
        id: 'prod_R2TfmQYMHxix1e',
        name: 'Pro',
        unit_amount: 9999, // $99.99
        recurring: { interval: 'month' },
        paymentLink: 'https://buy.stripe.com/28oaGf9v47yoacMaEF'
      },
      {
        id: 'prod_R2TgIYi0HUAYxf',
        name: 'Enterprise',
        unit_amount: 19999, // $199.99
        recurring: { interval: 'month' },
        paymentLink: 'https://buy.stripe.com/4gw29J7mWg4U98I002'
      }
    ];

    res.json(products);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Create a checkout session
router.post('/create-checkout-session', async (req, res) => {
  const { productId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      client_reference_id: userId,
      customer_email: req.user?.email,
      line_items: [
        {
          price: productId,
          quantity: 1,
        },
      ],
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify subscription status
router.get('/subscription-status', async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    res.json({
      active: subscription.status === 'active',
      currentPeriodEnd: subscription.current_period_end,
      plan: subscription.plan.nickname
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes working' });
});

module.exports = router;
