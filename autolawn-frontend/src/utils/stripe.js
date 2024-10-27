// utils/stripe.js
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15', // Use the latest stable Stripe API version
});

module.exports = stripe;
