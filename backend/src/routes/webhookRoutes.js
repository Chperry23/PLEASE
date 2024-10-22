const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');
const Profile = require('../models/Profile');
const bodyParser = require('body-parser');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('Received Stripe event:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process the event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSession(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionEvent(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send('Received');
  }
);

const handleCheckoutSession = async (session) => {
  try {
    console.log('Processing checkout session:', session);
    const userId = session.metadata.userId;
    const user = await User.findById(userId);

    if (user) {
      user.stripeCustomerId = session.customer;
      user.stripeSubscriptionId = session.subscription;
      user.subscriptionActive = true;
      user.subscriptionTier = session.metadata.plan || 'Pro';
      user.trialEndDate = null;

      await user.save();

      // Update Profile as well
      const profile = await Profile.findOne({ user: userId });
      if (profile) {
        profile.subscriptionActive = true;
        profile.subscriptionTier = user.subscriptionTier;
        profile.cancellationRequested = false;
        profile.subscriptionEndDate = null;
        await profile.save();
      }

      console.log(`Subscription activated for user: ${user.email}, Tier: ${user.subscriptionTier}`);
    } else {
      console.error(`User with ID ${userId} not found.`);
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
};

const handleSubscriptionEvent = async (subscription) => {
  try {
    console.log('Processing subscription event:', subscription);
    const user = await User.findOne({ stripeCustomerId: subscription.customer });

    if (user) {
      user.subscriptionActive = subscription.status === 'active';
      const priceId = subscription.items.data[0].price.id;
      const tierMap = {
        'price_1QBkfgE1a6rnB8cNH52neUnu': 'Basic',
        // Add more mappings if you have additional price IDs for other tiers
      };
      user.subscriptionTier = tierMap[priceId] || 'Pro';

      if (subscription.status === 'active') {
        user.trialEndDate = null;
      }

      await user.save();

      // Update Profile as well
      const profile = await Profile.findOne({ user: user._id });
      if (profile) {
        profile.subscriptionActive = user.subscriptionActive;
        profile.subscriptionTier = user.subscriptionTier;
        await profile.save();
      }

      console.log(`Subscription updated for user: ${user.email} - Active: ${user.subscriptionActive}, Tier: ${user.subscriptionTier}`);
    } else {
      console.error(`User with Stripe Customer ID ${subscription.customer} not found.`);
    }
  } catch (error) {
    console.error('Error handling subscription event:', error);
    throw error;
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (user) {
      user.subscriptionActive = false;
      user.subscriptionTier = 'Free';
      user.stripeSubscriptionId = '';
      user.cancellationRequested = false;
      await user.save();

      const profile = await Profile.findOne({ user: user._id });
      if (profile) {
        profile.subscriptionActive = false;
        profile.subscriptionTier = 'Free';
        profile.cancellationRequested = false;
        profile.subscriptionEndDate = null;
        await profile.save();
      }

      console.log(`Subscription deleted for user: ${user.email}`);
    } else {
      console.error(`User with Stripe Subscription ID ${subscription.id} not found.`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted event:', error);
    throw error;
  }
};

module.exports = router;