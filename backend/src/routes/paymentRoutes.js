// backend/src/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const auth = require('../middleware/auth');
const User = require('../models/user');

// Constants for product and price mapping
const PRODUCTS = {
  BASIC: {
    id: 'prod_R2TeQ4r5iOH6CG',
    priceId: 'price_1QAOgoE1a6rnB8cNdwUVro0S',
  },
  PRO: {
    id: 'prod_R2TfmQYMHxix1e',
    priceId: 'price_1QAOhxE1a6rnB8cN0Ceo9AXM',
  },
  ENTERPRISE: {
    id: 'prod_R2TgIYi0HUAYxf',
    priceId: 'price_1QAOisE1a6rnB8cNlvqaNaAN',
  },
};

const STRIPE_SUCCESS_URL = 'https://autolawn.app/subscription-success';
const STRIPE_CANCEL_URL = 'https://autolawn.app/pricing';

// Function to determine subscription tier from price ID
function getTierFromPriceId(priceId) {
  switch (priceId) {
    case PRODUCTS.BASIC.priceId:
      return 'basic';
    case PRODUCTS.PRO.priceId:
      return 'pro';
    case PRODUCTS.ENTERPRISE.priceId:
      return 'enterprise';
    default:
      return null;
  }
}

// Create a new Stripe Checkout Session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    console.log('--- /create-checkout-session called ---');
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user ? req.user._id : 'No user');

    const user = req.user;
    const { priceId } = req.body;

    if (!priceId) {
      console.error('Price ID is missing from request body');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log('User does not have a Stripe customer ID. Creating new Stripe customer...');
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      console.log('New Stripe customer created:', customer.id);

      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
      console.log('User updated with new Stripe customer ID');
    } else {
      console.log('User already has a Stripe customer ID:', stripeCustomerId);
    }

    // Log detailed information before creating the Checkout Session
    console.log('--- Creating Stripe Checkout Session ---');
    console.log('User ID:', user._id.toString());
    console.log('User Email:', user.email);
    console.log('User Stripe Customer ID:', user.stripeCustomerId);
    console.log('Stripe Customer ID used in session:', stripeCustomerId);
    console.log('Price ID:', priceId);
    console.log('Success URL:', STRIPE_SUCCESS_URL);
    console.log('Cancel URL:', STRIPE_CANCEL_URL);
    console.log('--- End of Checkout Session Creation Logs ---');

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      client_reference_id: user._id.toString(),
      success_url: `${STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CANCEL_URL,
    });

    console.log('Stripe Checkout Session created:', session.id);

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify subscription status after checkout
router.post('/verify-session', auth, async (req, res) => {
  try {
    console.log('--- /verify-session called ---');
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user ? req.user._id : 'No user');

    const { sessionId } = req.body;

    if (!sessionId) {
      console.error('Session ID is missing from request body');
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log('Verifying session with session_id:', sessionId);

    // Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Retrieved Checkout Session:', session);

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('Retrieved Subscription:', subscription);

    // Update user's subscription status in the database
    const user = await User.findById(session.client_reference_id);

    if (!user) {
      console.error('User not found with ID:', session.client_reference_id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updating user subscription details...');
    user.stripeSubscriptionId = subscription.id;
    user.subscriptionTier = getTierFromPriceId(subscription.items.data[0].price.id);
    user.subscriptionActive = ['active', 'trialing'].includes(subscription.status);
    await user.save();

    console.log('User subscription updated:', {
      userId: user._id.toString(),
      stripeSubscriptionId: user.stripeSubscriptionId,
      subscriptionTier: user.subscriptionTier,
      subscriptionActive: user.subscriptionActive,
    });

    res.json({
      success: true,
      subscriptionStatus: subscription.status,
      user,
    });
  } catch (err) {
    console.error('Session verification error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Export the router
module.exports = router;
