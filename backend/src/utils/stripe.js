const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configure Stripe client
const stripeClient = stripe;

module.exports = stripeClient;
