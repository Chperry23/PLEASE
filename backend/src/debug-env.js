// src/debug-env.js
require('dotenv').config({ path: '../.env' });  // Adjust path if needed

console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);
console.log('Raw GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Raw GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('Has spaces GOOGLE_CLIENT_ID:', /\s/.test(process.env.GOOGLE_CLIENT_ID));
console.log('Length GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.length);
console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('GOOGLE')));

// Test config loading
try {
  const config = require('./config/config');
  console.log('Config loading test:', {
    hasGoogleConfig: !!config.auth?.google,
    clientIDFromConfig: !!config.auth?.google?.clientID,
    clientSecretFromConfig: !!config.auth?.google?.clientSecret
  });
} catch (error) {
  console.error('Error loading config:', error);
}
