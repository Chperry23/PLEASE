// routes/webhooks.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const User = require('../models/user');

// Webhook handler
router.post('/', async (req, res) => {
  let event;

  // Log incoming request headers and body for debugging
  console.log('Webhook received:');
  console.log('Headers:', req.headers);
  console.log('Raw Body:', req.rawBody ? req.rawBody.toString('utf8') : 'No raw body');

  try {
    const sig = req.headers['stripe-signature'];

    // Use the raw body sent by Stripe
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Received Stripe webhook event: ${event.type}`);

  } catch (err) {
    console.error('Error verifying Stripe webhook signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'charge.dispute.closed':
        await handleChargeDisputeClosed(event);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event);
        break;

      case 'checkout.session.async_payment_failed':
        await handleCheckoutSessionAsyncPaymentFailed(event);
        break;

      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutSessionAsyncPaymentSucceeded(event);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'customer.created':
        await handleCustomerCreated(event);
        break;

      case 'customer.subscription.created':
        await handleCustomerSubscriptionCreated(event);
        break;

      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event);
        break;

      case 'customer.subscription.trial_will_end':
        await handleCustomerSubscriptionTrialWillEnd(event);
        break;

      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(event);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event);
        break;

      case 'invoice.created':
        await handleInvoiceCreated(event);
        break;

      case 'invoice.deleted':
        await handleInvoiceDeleted(event);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event);
        break;

      // Handle additional events as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.json({ received: true });

  } catch (err) {
    console.error('Error handling Stripe webhook event:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Handler functions for each event type
async function handleChargeDisputeClosed(event) {
  const dispute = event.data.object;
  console.log(`Dispute closed: ${dispute.id}`);
  // For testing, print dispute details
  console.log('Dispute details:', dispute);
}

async function handleChargeDisputeCreated(event) {
  const dispute = event.data.object;
  console.log(`Dispute created: ${dispute.id}`);
  // For testing, print dispute details
  console.log('Dispute details:', dispute);
}

async function handleCheckoutSessionAsyncPaymentFailed(event) {
  const session = event.data.object;
  console.log(`Async payment failed for session: ${session.id}`);
  // For testing, print session details
  console.log('Session details:', session);
}

async function handleCheckoutSessionAsyncPaymentSucceeded(event) {
  const session = event.data.object;
  console.log(`Async payment succeeded for session: ${session.id}`);
  // For testing, print session details
  console.log('Session details:', session);
}

async function handleCheckoutSessionCompleted(event) {
  const session = event.data.object;
  console.log(`Checkout session completed: ${session.id}`);
  // For testing, print session details
  console.log('Session details:', session);

  // Update user subscription
  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('Retrieved subscription:', subscription);

    const updatedUser = await User.findOneAndUpdate(
      { email: session.customer_email },
      {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        subscriptionTier: 'pro', // Adjust as needed
        subscriptionActive: true,
      },
      { new: true }
    );

    if (updatedUser) {
      console.log(`Updated subscription for ${session.customer_email}`);
    } else {
      console.log(`User with email ${session.customer_email} not found`);
    }
  } catch (err) {
    console.error('Error updating user subscription:', err);
  }
}

async function handleCustomerCreated(event) {
  const customer = event.data.object;
  console.log(`Customer created: ${customer.id}`);
  // For testing, print customer details
  console.log('Customer details:', customer);
}

async function handleCustomerSubscriptionCreated(event) {
  const subscription = event.data.object;
  console.log(`Subscription created: ${subscription.id}`);
  // For testing, print subscription details
  console.log('Subscription details:', subscription);
}

async function handleCustomerSubscriptionDeleted(event) {
  const subscription = event.data.object;
  console.log(`Subscription deleted: ${subscription.id}`);

  // Update user subscription status
  try {
    const updatedUser = await User.findOneAndUpdate(
      { stripeCustomerId: subscription.customer },
      {
        subscriptionActive: false,
        subscriptionTier: null,
        stripeSubscriptionId: null,
      },
      { new: true }
    );

    if (updatedUser) {
      console.log(`Cancelled subscription for customer ${subscription.customer}`);
    } else {
      console.log(`User with Stripe customer ID ${subscription.customer} not found`);
    }
  } catch (err) {
    console.error('Error cancelling subscription:', err);
  }
}

async function handleCustomerSubscriptionTrialWillEnd(event) {
  const subscription = event.data.object;
  console.log(`Subscription trial will end: ${subscription.id}`);
  // For testing, print subscription details
  console.log('Subscription details:', subscription);
}

async function handleCustomerSubscriptionUpdated(event) {
  const subscription = event.data.object;
  console.log(`Subscription updated: ${subscription.id}`);
  // For testing, print subscription details
  console.log('Subscription details:', subscription);
}

async function handleCustomerUpdated(event) {
  const customer = event.data.object;
  console.log(`Customer updated: ${customer.id}`);
  // For testing, print customer details
  console.log('Customer details:', customer);
}

async function handleInvoiceCreated(event) {
  const invoice = event.data.object;
  console.log(`Invoice created: ${invoice.id}`);
  // For testing, print invoice details
  console.log('Invoice details:', invoice);
}

async function handleInvoiceDeleted(event) {
  const invoice = event.data.object;
  console.log(`Invoice deleted: ${invoice.id}`);
  // For testing, print invoice details
  console.log('Invoice details:', invoice);
}

async function handleInvoiceFinalized(event) {
  const invoice = event.data.object;
  console.log(`Invoice finalized: ${invoice.id}`);
  // For testing, print invoice details
  console.log('Invoice details:', invoice);
}

module.exports = router;
