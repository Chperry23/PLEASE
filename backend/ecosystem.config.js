// Load environment variables from .env file
console.log('Loading environment variables...');
console.log('Current directory:', __dirname);

try {
  const result = dotenv.config();
  if (result.error) {
    console.warn('Warning loading .env file:', result.error.message);
  } else {
    console.log('Successfully loaded .env file');
  }
} catch (error) {
  console.warn('Warning: Error loading .env:', error.message);
}

// Debug loaded variables without exposing sensitive data
console.log('Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
  STRIPE_KEY_LENGTH: process.env.STRIPE_SECRET_KEY?.length || 0,
  MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
  CURRENT_DIR: __dirname
});

module.exports = {
  apps: [{
    name: 'autolawn',
    script: 'src/app.js',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '5s',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      API_URL: 'https://autolawn.app',
      FRONTEND_URL: 'https://autolawn.app',
      
      // Database
      MONGODB_URI: process.env.MONGODB_URI,
      
      // Authentication
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      
      // Stripe
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      
      // Google OAuth
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      
      // Mail
      MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
      MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
      
      // SMS
      VONAGE_API_KEY: process.env.VONAGE_API_KEY,
      VONAGE_API_SECRET: process.env.VONAGE_API_SECRET,
      VONAGE_SMS_FROM: process.env.VONAGE_SMS_FROM
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
    
    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // Cluster mode
    instances: 1,
    exec_mode: 'fork',
    
    // Graceful shutdown
    kill_timeout: 3000,
    
    // Memory management
    max_memory_restart: '1G',
    
    // Misc
    node_args: '--max_old_space_size=1536'
  }]
};
