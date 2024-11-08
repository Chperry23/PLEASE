// Debug environment loading
console.log('Loading stripe utility...');
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

// Detailed environment check
console.log('Stripe initialization environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
  STRIPE_KEY_LENGTH: process.env.STRIPE_SECRET_KEY?.length,
  STRIPE_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
  STRIPE_KEY_SUFFIX: process.env.STRIPE_SECRET_KEY?.slice(-6)
});

// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('Loading .env from:', envPath);
  require('dotenv').config({ path: envPath });
}

// Validate Stripe key
function validateStripeKey(key) {
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is required but not found in environment variables');
  }

  if (key.includes('fxbKxY')) {
    throw new Error('Using expired Stripe key - please check environment variables');
  }

  if (!key.startsWith('sk_')) {
    throw new Error('Invalid Stripe key format');
  }

  return true;
}

// Debug Stripe key
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but not found in environment variables');
}

try {
  validateStripeKey(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.error('Stripe key validation error:', error.message);
  throw error;
}

// Initialize Stripe with validated key
const stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = stripeClient;
