// Debug environment loading
console.log('Loading stripe utility...');
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('Loading .env from:', envPath);
  require('dotenv').config({ path: envPath });
}

// Debug Stripe key
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but not found in environment variables');
}

// Initialize Stripe
const stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = stripeClient;
