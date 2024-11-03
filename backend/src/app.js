// app.js

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const crewRoutes = require('./routes/crewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const profileRoutes = require('./routes/profileroutes');
const routeRoutes = require('./routes/routeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes'); // Updated to match the actual filename
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const userRoutes = require('./routes/userRoutes');

// Import passport configuration
require('./config/passport');

// Initialize Express app
const app = express();

// Trust proxy settings if behind a reverse proxy (e.g., Nginx)
app.set('trust proxy', true);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Basic request logging (before any body parsing)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS configuration - Before any body parsing but after logging
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://autolawn.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
}));

// Webhook route must come before any body parsers
// Preserve the raw body for Stripe
app.use(
  '/api/webhooks/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  },
  webhookRoutes
);

// After webhook route, setup regular body parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'A7f5J9kL3uP2Z1tV',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  proxy: true,
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Transaction retry middleware
app.use((req, res, next) => {
  req.retryTransaction = async (fn, maxRetries = 5) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        console.error(`Transaction error (Attempt ${retries + 1}):`, error);
        if (error.code === 112 && error.codeName === 'WriteConflict') {
          retries++;
          console.log(`Retrying transaction. Attempt ${retries} of ${maxRetries}`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Transaction failed after max retries');
  };
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/crews', crewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
// Note: Do not re-register the webhook route here

// CSV import route
app.post('/api/customers/import',
  multer({ dest: 'temp/' }).single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          console.log('Parsed CSV data:', results);
          res.json({ message: 'Customers imported successfully', count: results.length });
        } catch (error) {
          console.error('Error saving customers:', error);
          res.status(500).json({ message: 'Error importing customers' });
        } finally {
          fs.unlinkSync(req.file.path);
        }
      });
  }
);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// 404 Route - Must come after all other routes
app.use((req, res) => {
  console.log('404 Not Found:', req.path);
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Error Handling Middleware - Must be last
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'MongoError' && err.code === 112) {
    return res.status(409).json({ message: 'Conflict detected. Please try again.' });
  }
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start the Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? '[SET]' : '[NOT SET]'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Google OAuth Callback URL: https://autolawn.app/api/auth/google/callback`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Starting graceful shutdown...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Starting graceful shutdown...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
