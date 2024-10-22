// backend/src/routes/auth.js

const express = require('express');
const passport = require('../config/passport'); // Correctly import configured passport
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Adjust the path as necessary
const authMiddleware = require('../middleware/auth'); // JWT authentication middleware

const router = express.Router();

// Google OAuth Routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], accessType: 'offline', prompt: 'consent' })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/signin` }),
  async (req, res) => {
    try {
      console.log('Handling Google OAuth callback');

      // User has been authenticated by Passport
      const user = await User.findById(req.user._id);

      if (!user) {
        throw new Error('User not found after authentication');
      }

      console.log(`Authenticated user: ${user.email}`);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          subscriptionActive: user.subscriptionActive,
          subscriptionTier: user.subscriptionTier,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      console.log(`Generated JWT token for user: ${user.email}`);

      // Redirect to frontend's LoginSuccess component with token
      res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/signin`); // Redirect to frontend sign-in page on error
    }
  }
);

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, plan } = req.body;

    if (!name || !email || !password || !plan) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be strings.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine subscription status based on plan
    let subscriptionActive = false;
    if (plan === 'Free') {
      subscriptionActive = true; // Free users have access
    } else {
      subscriptionActive = false; // Paid plans require payment
    }

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionTier: plan, // Changed from subscriptionPlan
      subscriptionActive,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        subscriptionActive: user.subscriptionActive,
        subscriptionTier: user.subscriptionTier, // Changed from subscriptionPlan
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Login Route with Detailed Debugging
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be strings.' });
    }

    // Ensure the password field is selected in the query
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.error('User not found');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    console.log(`User found: ${user.email}`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Password does not match');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        subscriptionActive: user.subscriptionActive,
        subscriptionTier: user.subscriptionTier, // Changed from subscriptionPlan
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Generated JWT token for user: ${user.email}`);

    res.status(200).json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Verify Token Route
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    console.log(`Verifying token for user ID: ${req.user.id}`);
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user) {
      console.error('User not found during token verification');
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed.' });
  }
});

// Update Preferences Route (Protected)
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

// Get User Analytics Route (Protected)
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Implement analytics logic here
    // Example:
    const analyticsData = {
      // Dummy data
      jobsCompleted: 42,
      customersServed: 100,
      revenue: 5000,
    };

    res.status(200).json({ analytics: analyticsData });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics.' });
  }
});

// Password Change Route (Protected)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // The auth middleware sets req.user
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Find the user and include the password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Example of a Correct Route Definition
router.get('/example-route', (req, res) => {
  res.send('This is an example route.');
});

module.exports = router;
