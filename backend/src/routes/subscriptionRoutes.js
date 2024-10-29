const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get subscription details
router.get('/details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      return res.json({
        success: true,
        subscription: {
          active: false,
          tier: null,
          currentPeriod: null
        }
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    res.json({
      success: true,
      subscription: {
        active: subscription.status === 'active',
        tier: user.subscriptionTier,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        status: subscription.status
      }
    });
  } catch (err) {
    logger.error('Error fetching subscription details:', err);
    res.status(500).json({ success: false, message: 'Error fetching subscription details' });
  }
});

// Cancel subscription
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
      logger.info('Subscription cleared for user:', user._id);
      return res.json({ success: true, message: 'Subscription status updated' });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    user.subscriptionActive = false;
    user.subscriptionTier = null;
    user.stripeSubscriptionId = null;
    await user.save();

    logger.info('Subscription cancelled for user:', user._id);

    res.json({
      success: true,
      message: 'Subscription cancellation scheduled',
      cancelAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (err) {
    logger.error('Error cancelling subscription:', err);
    res.status(500).json({ success: false, message: 'Server error while cancelling subscription' });
  }
});

// Update subscription
router.post('/update', auth, async (req, res) => {
  try {
    const { newPriceId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    // Create prorated update
    const updatedSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice',
      }
    );

    logger.info('Subscription updated for user:', user._id);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: updatedSubscription
    });
  } catch (err) {
    logger.error('Error updating subscription:', err);
    res.status(500).json({ success: false, message: 'Error updating subscription' });
  }
});

// Resume cancelled subscription
router.post('/resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'No subscription found' });
    }

    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    user.subscriptionActive = true;
    await user.save();

    logger.info('Subscription resumed for user:', user._id);

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      subscription
    });
  } catch (err) {
    logger.error('Error resuming subscription:', err);
    res.status(500).json({ success: false, message: 'Error resuming subscription' });
  }
});

module.exports = router;
