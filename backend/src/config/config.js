const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  email: {
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  },
  sms: {
    vonage: {
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
      from: process.env.VONAGE_SMS_FROM
    }
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    options: {
      apiVersion: '2023-10-16',
      maxNetworkRetries: 2,
      timeout: 30000,
    }
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL || 'https://autolawn.app'}/api/auth/google/callback`
    }
  },
  urls: {
    api: process.env.API_URL || 'https://autolawn.app',
    frontend: process.env.FRONTEND_URL || 'https://autolawn.app'
  }
};

// Log configuration (excluding sensitive data)
console.log('Configuration loaded:', {
  env: config.env,
  port: config.port,
  mongodb: config.mongodb.uri ? 'Set' : 'Not set',
  mailgun: config.email.mailgun.apiKey ? 'Set' : 'Not set',
  stripe: {
    secretKey: config.stripe.secretKey ? 'Set' : 'Not set',
    webhookSecret: config.stripe.webhookSecret ? 'Set' : 'Not set'
  },
  google: {
    clientID: config.auth.google.clientID ? 'Set' : 'Not set',
    callbackURL: config.auth.google.callbackURL
  },
  urls: config.urls
});

module.exports = config;
