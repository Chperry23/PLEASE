// backend/src/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const auth = require('../middleware/auth');
const User = require('../models/user');

const STRIPE_SUCCESS_URL = 'https://autolawn.app/subscription-success';
const STRIPE_CANCEL_URL = 'https://autolawn.app/pricing';

// Create a new Stripe Checkout Session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    console.log('Creating checkout session...');
    const user = req.user;
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });

      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
      },
      customer: stripeCustomerId,
      client_reference_id: user._id.toString(),
      success_url: `${STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CANCEL_URL,
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',
      },
      billing_address_collection: 'required',
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Verify subscription status after checkout
router.post('/verify-session', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const user = await User.findById(session.client_reference_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.stripeSubscriptionId = subscription.id;
    user.subscriptionTier = subscription.items.data[0].price.id;
    user.subscriptionActive = ['active', 'trialing'].includes(subscription.status);
    await user.save();

    res.json({
      success: true,
      subscriptionStatus: subscription.status,
      user,
    });
  } catch (err) {
    console.error('Session verification error:', err);
    res.status(400).json({ 
      error: 'Session verification failed',
      details: err.message 
    });
  }
});

// Get subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.json({
        active: false,
        tier: null
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    res.json({
      active: ['active', 'trialing'].includes(subscription.status),
      tier: subscription.items.data[0].price.id
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription status',
      details: error.message 
    });
  }
});

module.exports = router;
