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
    uri: process.env.MONGODB_URI || 'mongodb+srv://chperry66:Testing@rbdb.umkoeqi.mongodb.net/test?retryWrites=true&w=majority'
  },
  email: {
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY || '5e815ebf2f0143bcadc3803bc30b4aab-5dcb5e36-5f11c10f',
      domain: process.env.MAILGUN_DOMAIN || 'sandbox09d83e81a23b4fcfb478c417424df18d.mailgun.org'
    }
  },
  sms: {
    vonage: {
      apiKey: process.env.VONAGE_API_KEY || '509d82f6',
      apiSecret: process.env.VONAGE_API_SECRET || 'DJ9Wi2wU2L8CwW27',
      from: process.env.VONAGE_SMS_FROM || '17162770383'
    }
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'ObUfi3Q7Vm4ja752sqUzGwVjSnbyjVduC2SuRp5ozzA',
    sessionSecret: process.env.SESSION_SECRET || 'A7f5J9kL3uP2Z1tV',
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '217971178414-7eohkhmq4s060nchf35ilsus7km0gt62.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
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
  google: {
    clientID: config.auth.google.clientID ? 'Set' : 'Not set',
    callbackURL: config.auth.google.callbackURL
  },
  urls: config.urls
});

module.exports = config;
