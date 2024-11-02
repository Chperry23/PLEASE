// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'autolawn',
      script: 'src/app.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        API_URL: 'https://autolawn.app',
        FRONTEND_URL: 'https://autolawn.app',
        // Load sensitive values from environment or .env file
        MONGODB_URI: process.env.MONGODB_URI,
        MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
        MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
        VONAGE_API_KEY: process.env.VONAGE_API_KEY,
        VONAGE_API_SECRET: process.env.VONAGE_API_SECRET,
        VONAGE_SMS_FROM: process.env.VONAGE_SMS_FROM,
        JWT_SECRET: process.env.JWT_SECRET,
        SESSION_SECRET: process.env.SESSION_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      time: true
    },
    {
      name: 'webhook',
      script: 'src/webhookServer.js',
      env: {
        NODE_ENV: 'production',
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
      }
    }
  ]
};
