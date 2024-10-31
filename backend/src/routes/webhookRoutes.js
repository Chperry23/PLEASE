const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('Webhook verified and received:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

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
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions remain the same...

module.exports = router;
