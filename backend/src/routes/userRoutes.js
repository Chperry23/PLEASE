const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

router.get('/:userId/subscription', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      subscriptionTier: user.subscriptionTier,
      subscriptionActive: user.subscriptionActive,
    });
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const { name, phoneNumber, customerBaseSize } = req.body;
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (customerBaseSize) user.customerBaseSize = customerBaseSize;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

const { verifyToken } = require('../middleware/auth'); // Importing the middleware correctly

// Use verifyToken (not authMiddleware)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

module.exports = router;
