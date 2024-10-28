const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');
const auth = require('../middleware/auth');

router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      user.subscriptionActive = false;
      user.subscriptionTier = null;
      await user.save();
      return res.json({ success: true, message: 'Subscription status updated' });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    user.subscriptionActive = false;
    user.subscriptionTier = null;
    user.stripeSubscriptionId = null;
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancellation scheduled',
      cancelAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({ success: false, message: 'Server error while cancelling subscription' });
  }
});

module.exports = router;
