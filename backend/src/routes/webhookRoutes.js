const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Test webhook endpoint
router.post('/test', (req, res) => {
  console.log('Test webhook received:', req.body);
  res.json({ received: true });
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    console.log('Received webhook:', {
      type: payload.type,
      id: payload.id
    });

    let event;
    try {
      event = endpointSecret 
        ? stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
        : payload;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Get user ID from client_reference_id
        const userId = session.client_reference_id;
        if (!userId) {
          throw new Error('No user ID in session');
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product);

        // Map product IDs to tiers
        const tierMap = {
          'prod_R2TeQ4r5iOH6CG': 'Basic',
          'prod_R2TfmQYMHxix1e': 'Pro',
          'prod_R2TgIYi0HUAYxf': 'Enterprise'
        };

        // Update user
        user.stripeCustomerId = session.customer;
        user.stripeSubscriptionId = session.subscription;
        user.subscriptionTier = tierMap[product.id] || 'Basic';
        user.subscriptionActive = true;

        await user.save();
        console.log(`Updated subscription for user ${userId}: ${user.subscriptionTier}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      throw new Error(`No user found for subscription: ${subscription.id}`);
    }

    user.subscriptionActive = subscription.status === 'active';
    await user.save();
    
    console.log(`Subscription updated for user: ${user._id}, status: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      throw new Error(`No user found for subscription: ${subscription.id}`);
    }

    user.subscriptionActive = false;
    user.subscriptionTier = null;
    user.stripeSubscriptionId = null;
    await user.save();

    console.log(`Subscription deleted for user: ${user._id}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

module.exports = router;
