const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const stripe = require('../utils/stripe');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

// Register endpoint
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

    // Create Stripe customer first
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        registrationSource: 'web'
      }
    });

    // Create new user with Stripe customer ID
    const user = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      stripeCustomerId: stripeCustomer.id
    });
    
    await user.save();
    console.log('User created successfully:', user._id);

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'ObUfi3Q7Vm4ja752sqUzGwVjSnbyjVduC2SuRp5ozzA',
      { expiresIn: '1d' }
    );

    // Return success with user data
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive
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
    
    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'ObUfi3Q7Vm4ja752sqUzGwVjSnbyjVduC2SuRp5ozzA',
      { expiresIn: '1d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Check subscription status
    if (!user.subscriptionTier || !user.subscriptionActive) {
      return res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          requiresSubscription: true
        },
        redirectTo: '/pricing'
      });
    }

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ObUfi3Q7Vm4ja752sqUzGwVjSnbyjVduC2SuRp5ozzA');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is required
    if (!user.subscriptionTier || !user.subscriptionActive) {
      return res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          requiresSubscription: true
        },
        redirectTo: '/pricing'
      });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
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
      // Create Stripe customer for Google OAuth users if they don't have one
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
        process.env.JWT_SECRET || 'ObUfi3Q7Vm4ja752sqUzGwVjSnbyjVduC2SuRp5ozzA',
        { expiresIn: '1d' }
      );

      // Check if user has subscription
      const user = await User.findById(req.user._id);
      if (!user.subscriptionTier || !user.subscriptionActive) {
        return res.redirect(`${process.env.FRONTEND_URL}/pricing?token=${token}`);
      }

      res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
    }
  }
);

module.exports = router;
