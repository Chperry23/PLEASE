const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  console.log('Webhook received:', {
    hasSignature: !!sig,
    contentType: req.headers['content-type'],
    bodyType: typeof req.body,
    hasRawBody: !!req.body,
    rawBodyStart: req.body ? req.body.toString().substring(0, 50) : null // Log start of raw body
  });

  try {
    let event;

    try {
      // Use req.body directly since express.raw() was used in app.js
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('Webhook verified successfully:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        signature: sig?.slice(0, 20),
        hasRawBody: !!req.body
      });
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
        if (session.client_reference_id && session.client_reference_id !== 'undefined') {
          user = await User.findById(session.client_reference_id);
          console.log('Found user by ID:', session.client_reference_id);
        }

        if (!user && customer.email) {
          user = await User.findOne({ email: customer.email });
          console.log('Found user by email:', customer.email);
        }

        if (!user) {
          console.error('No user found for session:', {
            id: session.id,
            clientId: session.client_reference_id,
            email: customer.email
          });
          return res.status(400).json({ error: 'User not found' });
        }

        // Get subscription details
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
        user.subscriptionStartDate = new Date();

        await user.save();
        console.log('Updated subscription for user:', {
          userId: user._id,
          tier: user.subscriptionTier,
          subscriptionId: user.stripeSubscriptionId
        });
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

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }

    user.subscriptionActive = subscription.status === 'active';
    user.subscriptionStatus = subscription.status;
    await user.save();
    
    console.log('Updated subscription status for user:', {
      userId: user._id,
      status: subscription.status,
      active: user.subscriptionActive
    });
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }

    user.subscriptionActive = false;
    user.subscriptionTier = null;
    user.stripeSubscriptionId = null;
    user.subscriptionStatus = 'canceled';
    await user.save();
    
    console.log('Subscription deleted for user:', user._id);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

module.exports = router;
