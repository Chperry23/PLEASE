// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Ensure Stripe is initialized correctly
const auth = require('../middleware/auth');
const User = require('../models/user');

// GET /api/payment/prices - Fetch available prices/plans from Stripe
router.get('/prices', auth, async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 10,
      expand: ['data.product'],
    });
    res.json(prices.data);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Unable to fetch prices' });
  }
});

// POST /api/payment/create-checkout-session - Create Stripe Checkout Session
router.post('/create-checkout-session', auth, async (req, res) => {
  const userId = req.user.id;
  const { priceId, plan } = req.body;

  if (!priceId || !plan) {
    return res.status(400).json({ error: 'Price ID and plan are required.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'An error occurred, unable to create session.' });
  }
});

// GET /api/payment/current-subscription - Fetch current subscription details
router.get('/current-subscription', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Unable to fetch subscription details.' });
  }
});

// POST /api/payment/downgrade - Downgrade subscription to a lower tier
router.post('/downgrade', auth, async (req, res) => {
  const userId = req.user.id;
  const { newPriceId } = req.body;

  if (!newPriceId) {
    return res.status(400).json({ error: 'New price ID is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    // Update subscription to the new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Update user subscription tier
    user.subscriptionTier = 'Downgraded Plan Name'; // Map priceId to plan name
    await user.save();

    res.json(updatedSubscription);
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({ error: 'Unable to downgrade subscription.' });
  }
});

// POST /api/payment/cancel - Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    // Cancel the subscription immediately
    const canceledSubscription = await stripe.subscriptions.del(user.stripeSubscriptionId);

    // Update user subscription status in the database
    user.subscriptionActive = false;
    user.stripeSubscriptionId = null;
    user.subscriptionTier = 'Free'; // Or another default tier
    await user.save();

    res.json({ message: 'Subscription canceled successfully.', subscription: canceledSubscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Unable to cancel subscription.' });
  }
});

module.exports = router;
