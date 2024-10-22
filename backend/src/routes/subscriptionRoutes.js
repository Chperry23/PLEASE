const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

router.post('/cancel', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const profile = await Profile.findOne({ user: req.user.id });
  
      // Add detailed logs
      console.log('User details:', user);
      console.log('Profile details:', profile);
  
      if (!user || !profile) {
        return res.status(404).json({ success: false, message: 'User or Profile not found' });
      }
  
      if (!user.stripeSubscriptionId) {
        user.subscriptionActive = false;
        user.subscriptionTier = 'Free';
        await user.save();
  
        profile.subscriptionActive = false;
        profile.subscriptionTier = 'Free';
        await profile.save();
  
        return res.json({
          success: true,
          message: 'Subscription status updated to Free',
        });
      }
  
      // If there is an active subscription, cancel it in Stripe
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
  
      user.subscriptionActive = false;
      user.subscriptionTier = 'Free';
      await user.save();
  
      profile.subscriptionActive = false;
      profile.subscriptionTier = 'Free';
      profile.cancellationRequested = true;
      profile.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
      await profile.save();
  
      res.json({
        success: true,
        message: 'Subscription cancellation scheduled',
        cancelAt: profile.subscriptionEndDate,
      });
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      res.status(500).json({ success: false, message: 'Server error while cancelling subscription' });
    }
  });

module.exports = router;