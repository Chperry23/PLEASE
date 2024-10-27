const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY); // Debugging

module.exports = stripe;
