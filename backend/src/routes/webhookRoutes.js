const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log('Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

async function handleCheckoutCompleted(session) {
  try {
    const userId = session.client_reference_id;
    if (!userId) {
      console.error('No client_reference_id found in session');
      return;
    }

    // Map product IDs to tier names
    const tierMap = {
      'prod_R2TeQ4r5iOH6CG': 'Basic',
      'prod_R2TfmQYMHxix1e': 'Pro',
      'prod_R2TgIYi0HUAYxf': 'Enterprise'
    };

    // Get the product ID from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const productId = lineItems.data[0].price.product;

    // Update user with subscription details
    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionActive: true,
      subscriptionTier: tierMap[productId] || 'Basic',
      subscriptionStartDate: new Date(),
    });

    console.log(`Subscription activated for user: ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }

    user.subscriptionActive = subscription.status === 'active';
    await user.save();

    console.log(`Subscription updated for user: ${user._id}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
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
    user.stripeSubscriptionId = null;
    user.subscriptionTier = null;
    await user.save();

    console.log(`Subscription deleted for user: ${user._id}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

module.exports = router;
