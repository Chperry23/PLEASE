const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const auth = require('../middleware/auth');

// Get all prices/products
router.get('/prices', async (req, res) => {
  try {
    const products = [
      {
        id: 'prod_R2TeQ4r5iOH6CG',
        name: 'Basic',
        unit_amount: 4999,
        recurring: { interval: 'month' },
        paymentLink: 'https://buy.stripe.com/00gaGf36G05W84EeUU',
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
        id: 'prod_R2TfmQYMHxix1e',
        name: 'Pro',
        unit_amount: 9999,
        recurring: { interval: 'month' },
        paymentLink: 'https://buy.stripe.com/28oaGf9v47yoacMaEF',
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
        id: 'prod_R2TgIYi0HUAYxf',
        name: 'Enterprise',
        unit_amount: 19999,
        recurring: { interval: 'month' },
        paymentLink: 'https://buy.stripe.com/4gw29J7mWg4U98I002',
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

// Create a checkout session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Create customer if they don't exist
    let customer;
    if (!req.user.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: userId
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // Fixed URL string template literals
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&client_reference_id=${userId}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      client_reference_id: userId,
      customer: customer?.id || req.user.stripeCustomerId,
      customer_email: !customer?.id ? req.user.email : undefined,
      line_items: [{
        price: productId,
        quantity: 1,
      }],
      metadata: {
        userId: userId,
        // Add subscription tier based on productId
        subscriptionTier: getSubscriptionTierFromProductId(productId)
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Helper function to map product IDs to subscription tiers
function getSubscriptionTierFromProductId(productId) {
  const tierMap = {
    'prod_R2TeQ4r5iOH6CG': 'basic',
    'prod_R2TfmQYMHxix1e': 'pro',
    'prod_R2TgIYi0HUAYxf': 'enterprise'
  };
  return tierMap[productId] || 'basic';
}
// Verify subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeSubscriptionId) {
      return res.json({
        active: false,
        tier: null
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    res.json({
      active: subscription.status === 'active',
      currentPeriodEnd: subscription.current_period_end,
      tier: user.subscriptionTier,
      status: subscription.status
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
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

// Add this to your existing payment routes
router.post('/verify-session', auth, async (req, res) => {
  try {
    const { sessionId, clientReferenceId, email } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // If we have a client reference ID, verify it matches
    if (clientReferenceId && session.client_reference_id && 
        session.client_reference_id !== clientReferenceId) {
      return res.status(403).json({ error: 'Invalid client reference' });
    }

    // If we have an email, verify it matches
    if (email && session.customer_email && 
        session.customer_email !== email) {
      return res.status(403).json({ error: 'Invalid email' });
    }

    // Get subscription status if available
    let subscription;
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription);
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

module.exports = router;
