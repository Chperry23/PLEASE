const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Apply express.raw() middleware only to this route
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Use req.body directly since express.raw() provides the raw buffer
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('Webhook verified and received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing checkout session:', session.id);
        
        // Get customer details
        const customer = await stripe.customers.retrieve(session.customer);
        
        // Try to find user by client_reference_id first, then by email
        let user = null;
        if (session.client_reference_id) {
          user = await User.findById(session.client_reference_id);
        }
        if (!user && customer.email) {
          user = await User.findOne({ email: customer.email });
        }
        
        if (!user) {
          console.error('No user found for session:', session.id);
          return res.status(400).json({ error: 'User not found' });
        }

        // Get subscription and product details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const productId = subscription.items.data[0].price.product;

        // Map product IDs to tiers
        const tierMap = {
          'prod_R2TeQ4r5iOH6CG': 'Basic',
          'prod_R2TfmQYMHxix1e': 'Pro',
          'prod_R2TgIYi0HUAYxf': 'Enterprise'
        };

        // Update user subscription details
        user.stripeCustomerId = session.customer;
        user.stripeSubscriptionId = session.subscription;
        user.subscriptionTier = tierMap[productId] || 'Basic';
        user.subscriptionActive = true;
        
        await user.save();
        console.log(`Updated subscription for user ${user._id}: ${user.subscriptionTier}`);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      // Add other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Helper functions for handling subscription updates and deletions
async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }

    // Update user subscription status
    user.subscriptionStatus = subscription.status;
    await user.save();
    console.log(`Updated subscription status for user ${user._id}: ${subscription.status}`);
  } catch (error) {
    console.error('Error updating user subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }

    // Deactivate user's subscription
    user.subscriptionActive = false;
    user.subscriptionStatus = subscription.status;
    await user.save();
    console.log(`Deactivated subscription for user ${user._id}`);
  } catch (error) {
    console.error('Error deactivating user subscription:', error);
  }
}

module.exports = router;
