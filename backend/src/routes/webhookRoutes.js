// backend/src/routes/webhookRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Ensure Stripe is initialized correctly
const User = require('../models/user'); // Replace with your actual User model
const bodyParser = require('body-parser');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware to parse the raw body required for Stripe webhooks
// It's crucial to use bodyParser.raw() here to obtain the exact payload sent by Stripe
router.post(
  '/',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Construct the event using the raw body and Stripe signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log(`Received Stripe event: ${event.type}`);
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
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

    // Return a response to acknowledge receipt of the event
    res.status(200).send('Received');
  }
);

/**
 * Handles the 'checkout.session.completed' event.
 * Updates the user's subscription details in the database.
 * @param {object} session - The Stripe Checkout Session object.
 */
const handleCheckoutSession = async (session) => {
  try {
    console.log('Processing checkout session:', session.id);

    const userId = session.client_reference_id;

    if (!userId) {
      console.error('No client_reference_id found in session.');
      return;
    }

    const user = await User.findById(userId);

    if (user) {
      // Update user with Stripe customer and subscription IDs
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
        `✅ Subscription activated for user: ${user.email}, Tier: ${user.subscriptionTier}`
      );
    } else {
      console.error(`❌ User with ID ${userId} not found.`);
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    // Important: Do not throw the error. Stripe expects a response.
  }
};

/**
 * Handles 'customer.subscription.created' and 'customer.subscription.updated' events.
 * Updates the user's subscription status and tier in the database.
 * @param {object} subscription - The Stripe Subscription object.
 */
const handleSubscriptionEvent = async (subscription) => {
  try {
    console.log('Processing subscription event:', subscription.id);
    const customerId = subscription.customer;

    const user = await User.findOne({ stripeCustomerId: customerId });

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
        `🔄 Subscription updated for user: ${user.email} - Active: ${user.subscriptionActive}, Tier: ${user.subscriptionTier}`
      );
    } else {
      console.error(`❌ User with Stripe Customer ID ${customerId} not found.`);
    }
  } catch (error) {
    console.error('Error handling subscription event:', error);
    // Important: Do not throw the error. Stripe expects a response.
  }
};

/**
 * Handles the 'customer.subscription.deleted' event.
 * Updates the user's subscription status in the database.
 * @param {object} subscription - The Stripe Subscription object.
 */
const handleSubscriptionDeleted = async (subscription) => {
  try {
    console.log('Processing subscription deletion:', subscription.id);
    const subscriptionId = subscription.id;

    const user = await User.findOne({ stripeSubscriptionId: subscriptionId });

    if (user) {
      user.subscriptionActive = false;
      user.subscriptionTier = null; // Optionally, reset the tier or assign a default
      user.stripeSubscriptionId = null;

      await user.save();

      console.log(`🛑 Subscription deleted for user: ${user.email}`);
    } else {
      console.error(`❌ User with Stripe Subscription ID ${subscriptionId} not found.`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted event:', error);
    // Important: Do not throw the error. Stripe expects a response.
  }
};

module.exports = router;
