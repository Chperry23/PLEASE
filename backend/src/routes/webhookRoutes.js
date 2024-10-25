// backend/src/routes/webhookRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');
const bodyParser = require('body-parser');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Use bodyParser to parse the raw body needed for Stripe webhooks
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Construct the event using the raw body and signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
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

    const userId = session.client_reference_id;

    if (!userId) {
      console.error('No client_reference_id found in session.');
      return;
    }

    const user = await User.findById(userId);

    if (user) {
      user.stripeCustomerId = session.customer;
      user.stripeSubscriptionId = session.subscription;
      user.subscriptionActive = true;

      // Retrieve subscription details to get the plan
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;

      // Map Stripe Price IDs to your subscription tiers
      const tierMap = {
        'price_1QBkfgE1a6rnB8cNH52neUnu': 'Basic',
        'price_1QBkgBE1a6rnB8cNSiTCvIRV': 'Pro',
        'price_1QBkgZE1a6rnB8cN1dj6Ciw9': 'Enterprise',
      };

      user.subscriptionTier = tierMap[priceId] || 'Basic';

      await user.save();

      console.log(
        `Subscription activated for user: ${user.email}, Tier: ${user.subscriptionTier}`
      );
    } else {
      console.error(`User with ID ${userId} not found.`);
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    // Do not throw error here; Stripe expects a response
  }
};

const handleSubscriptionEvent = async (subscription) => {
  try {
    console.log('Processing subscription event:', subscription.id);
    const user = await User.findOne({ stripeCustomerId: subscription.customer });

    if (user) {
      user.subscriptionActive = subscription.status === 'active';
      const priceId = subscription.items.data[0].price.id;

      // Map Stripe Price IDs to your subscription tiers
      const tierMap = {
        'price_1QBkfgE1a6rnB8cNH52neUnu': 'Basic',
        'price_1QBkgBE1a6rnB8cNSiTCvIRV': 'Pro',
        'price_1QBkgZE1a6rnB8cN1dj6Ciw9': 'Enterprise',
      };
      user.subscriptionTier = tierMap[priceId] || 'Basic';

      user.stripeSubscriptionId = subscription.id;

      await user.save();

      console.log(
        `Subscription updated for user: ${user.email} - Active: ${user.subscriptionActive}, Tier: ${user.subscriptionTier}`
      );
    } else {
      console.error(`User with Stripe Customer ID ${subscription.customer} not found.`);
    }
  } catch (error) {
    console.error('Error handling subscription event:', error);
    // Do not throw error here; Stripe expects a response
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  try {
    console.log('Processing subscription deletion:', subscription.id);
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });

    if (user) {
      user.subscriptionActive = false;
      user.subscriptionTier = null; // Adjust as needed
      user.stripeSubscriptionId = null;

      await user.save();

      console.log(`Subscription deleted for user: ${user.email}`);
    } else {
      console.error(`User with Stripe Subscription ID ${subscription.id} not found.`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted event:', error);
    // Do not throw error here; Stripe expects a response
  }
};

module.exports = router;
