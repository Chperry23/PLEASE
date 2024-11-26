// src/routes/auth.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const stripe = require('../utils/stripe');
const verifyToken = require('../middleware/auth'); // Import the auth middleware
const Profile = require('../models/profile');

router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { ...req.body, password: '[FILTERED]' });
    const { name, email, password } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        registrationSource: 'web'
      }
    });

    // Create new user (password will be hashed in the pre-save hook)
    const user = new User({
      name,
      email,
      password,
      stripeCustomerId: stripeCustomer.id
    });

    await user.save();
    console.log('User created successfully:', user._id);

    // **Create a profile for the new user**
    const profile = new Profile({
      user: user._id,
      businessInfo: {},
      services: [],
    });

    await profile.save();
    console.log('Profile created successfully:', profile._id);

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set the token cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Return success with user data
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive,
        needsSubscription: true
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Password mismatch for user: ${email}`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.subscriptionTier || !user.subscriptionActive) {
      console.log(`User ${email} attempted to log in without an active subscription.`);
      return res.status(403).json({ message: 'Access denied. Please subscribe to access your account.' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    user.lastLogin = new Date();
    await user.save();

    // Set cookie and return both user and token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive,
        phoneNumber: user.phoneNumber,
        customerBaseSize: user.customerBaseSize,
        needsProfile: !user.phoneNumber || !user.customerBaseSize
      },
      token  // Add this line to include token in response
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify token endpoint
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine if user needs subscription or profile completion
    const needsSubscription = !user.subscriptionTier || !user.subscriptionActive;
    const needsProfile = !user.phoneNumber || !user.customerBaseSize;

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive,
        phoneNumber: user.phoneNumber,
        customerBaseSize: user.customerBaseSize,
        needsSubscription,
        needsProfile
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  });
  res.json({ message: 'Logged out successfully' });
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  async (req, res) => {
    try {
      // Create Stripe customer if not exists
      if (!req.user.stripeCustomerId) {
        const stripeCustomer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: {
            registrationSource: 'google_oauth'
          }
        });

        await User.findByIdAndUpdate(req.user._id, {
          stripeCustomerId: stripeCustomer.id
        });
      }

      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Set token as HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      // Determine user status
      const needsSubscription = !req.user.subscriptionTier || !req.user.subscriptionActive;
      const needsProfile = !req.user.phoneNumber || !req.user.customerBaseSize;

      // Redirect to frontend without token in URL
      res.redirect(`${process.env.FRONTEND_URL}/oauth-success?needsSubscription=${needsSubscription}&needsProfile=${needsProfile}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
    }
  }
);

module.exports = router;
