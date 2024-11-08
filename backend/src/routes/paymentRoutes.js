const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const auth = require('../middleware/auth');

// Constants for product and price mapping
const PRODUCTS = {
  BASIC: {
    id: 'prod_R2TeQ4r5iOH6CG',
    priceId: 'price_1QAOgoE1a6rnB8cNdwUVro0S',
    link: 'https://buy.stripe.com/00gaGf36G05W84EeUU'
  },
  PRO: {
    id: 'prod_R2TfmQYMHxix1e',
    priceId: 'price_1QAOhxE1a6rnB8cN0Ceo9AXM',
    link: 'https://buy.stripe.com/28oaGf9v47yoacMaEF'
  },
  ENTERPRISE: {
    id: 'prod_R2TgIYi0HUAYxf',
    priceId: 'price_1QAOisE1a6rnB8cNlvqaNaAN',
    link: 'https://buy.stripe.com/4gw29J7mWg4U98I002'
  }
};

const TIER_MAP = {
  [PRODUCTS.BASIC.id]: 'basic',
  [PRODUCTS.PRO.id]: 'pro',
  [PRODUCTS.ENTERPRISE.id]: 'enterprise'
};

// Get all prices/products
router.get('/prices', auth, async (req, res) => {
  try {
    const user = req.user;
    
    const products = [
      {
        id: PRODUCTS.BASIC.id,
        name: 'Basic',
        unit_amount: 4999,
        recurring: { interval: 'month' },
        paymentLink: `${PRODUCTS.BASIC.link}?client_reference_id=${user?._id}&prefilled_email=${user?.email}`,
        features: [
          'Up to 50 customers',
          'Advanced scheduling',
          'Full job tracking',
          'Email and phone support',
          'Basic route optimization',
          'Basic analytics'
        ]
      },
      {
        id: PRODUCTS.PRO.id,
        name: 'Pro',
        unit_amount: 9999,
        recurring: { interval: 'month' },
        paymentLink: `${PRODUCTS.PRO.link}?client_reference_id=${user?._id}&prefilled_email=${user?.email}`,
        recommended: true,
        features: [
          'Unlimited customers',
          'Advanced scheduling',
          'Full job tracking',
          'Priority support',
          'Advanced route optimization',
          'Advanced analytics',
          'Team management'
        ]
      },
      {
        id: PRODUCTS.ENTERPRISE.id,
        name: 'Enterprise',
        unit_amount: 19999,
        recurring: { interval: 'month' },
        paymentLink: `${PRODUCTS.ENTERPRISE.link}?client_reference_id=${user?._id}&prefilled_email=${user?.email}`,
        features: [
          'Unlimited customers',
          'Advanced scheduling',
          'Full job tracking',
          '24/7 dedicated support',
          'Advanced route optimization',
          'Custom analytics',
          'Advanced team management'
        ]
      }
    ];
    res.json(products);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Verify subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    console.log('Checking subscription status for user:', req.user._id);
    
    const user = req.user;
    if (!user.stripeSubscriptionId) {
      console.log('No subscription ID found');
      return res.json({
        active: false,
        tier: null
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    console.log('Retrieved subscription:', subscription.id);

    res.json({
      active: subscription.status === 'active' || subscription.status === 'trialing',
      currentPeriodEnd: subscription.current_period_end,
      tier: user.subscriptionTier,
      status: subscription.status
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Add session verification endpoint
router.post('/verify-session', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log('Verifying session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Retrieved session:', session.id);
    
    // Get subscription if available
    let subscription;
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription);
      console.log('Subscription status:', subscription.status);
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        subscriptionStatus: subscription?.status,
        customerId: session.customer,
        subscriptionId: session.subscription
      }
    });
  } catch (err) {
    console.error('Session verification error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: subscription.cancel_at
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
