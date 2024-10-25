// backend/src/routes/subscriptionRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');
const auth = require('../middleware/auth');

router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    console.log('User details:', user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      user.subscriptionActive = false;
      user.subscriptionTier = null;
      await user.save();

      return res.json({
        success: true,
        message: 'Subscription status updated',
      });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    user.subscriptionActive = false;
    user.subscriptionTier = null;
    user.stripeSubscriptionId = null;
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancellation scheduled',
      cancelAt: new Date(subscription.current_period_end * 1000),
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({ success: false, message: 'Server error while cancelling subscription' });
  }
});

module.exports = router;
