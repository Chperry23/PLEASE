const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const crewRoutes = require('./routes/crewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const quoteRoutes = require(path.resolve(__dirname, './routes/quoteRoutes'));
const profileRoutes = require('./routes/profileroutes');
const routeRoutes = require('./routes/routeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const connectDB = require('./config/database'); // Import connectDB from the utility file

// Import passport configuration
require('./config/passport');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Add Stripe-specific middleware for webhook signature verification
app.use(
  express.json({
    verify: function (req, res, buf) {
      req.rawBody = buf; // Store raw body buffer for Stripe webhook signature verification
    },
  })
);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'A7f5J9kL3uP2Z1tV',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware for retrying transactions
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
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
        } else {
          throw error;
        }
      }
    }
    throw new Error('Transaction failed after max retries');
  };
  next();
});

// Use routes
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
app.use('/api/webhooks', webhookRoutes);

// CSV import route
app.post('/api/customers/import', multer({ dest: 'temp/' }).single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        // Process the results and save to database
        console.log('Parsed CSV data:', results);

        res.json({ message: 'Customers imported successfully', count: results.length });
      } catch (error) {
        console.error('Error saving customers:', error);
        res.status(500).json({ message: 'Error importing customers' });
      } finally {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
      }
    });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404 Route
app.use((req, res, next) => {
  res.status(404).send('Not Found');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'MongoError' && err.code === 112) {
    return res.status(409).json({ message: 'Conflict detected. Please try again.' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Google OAuth Callback URL: http://localhost:${PORT}/api/auth/google/callback`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});
