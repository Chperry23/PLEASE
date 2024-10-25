// backend/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

// Fetch user subscription data
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

// Update User Profile (collect additional data)
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, customerBaseSize, jobTypes } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        phoneNumber,
        customerBaseSize,
        jobTypes,
      },
      { new: true }
    ).select('-password');

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
