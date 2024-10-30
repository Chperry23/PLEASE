const express = require('express');
const router = express.Router();
const User = require('../models/user');
const verifyToken = require('../middleware/auth');  // Import the middleware once with the correct name

// Get user subscription
router.get('/:userId/subscription', verifyToken, async (req, res) => {
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
router.put('/', verifyToken, async (req, res) => {
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

// Get user details
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
