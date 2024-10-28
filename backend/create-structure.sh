#!/bin/bash

# Create necessary directories
mkdir -p src/routes src/models src/config src/middleware src/utils

# Create basic route files
cat > src/routes/auth.js << 'EOL'
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

module.exports = router;
EOL

cat > src/routes/jobRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Job routes working' });
});

module.exports = router;
EOL

cat > src/routes/customerRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Customer routes working' });
});

module.exports = router;
EOL

cat > src/routes/paymentRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes working' });
});

module.exports = router;
EOL

cat > src/routes/webhookRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  console.log('Webhook received');
  res.status(200).end();
});

module.exports = router;
EOL

# Create basic configuration
cat > src/config/passport.js << 'EOL'
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport configuration will go here
module.exports = passport;
EOL

# Create ecosystem config file
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'autolawn',
    script: './src/app.js',
    watch: true,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOL

echo "Directory structure and basic files created"
