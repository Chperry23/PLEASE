const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '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');

module.exports = stripe;
