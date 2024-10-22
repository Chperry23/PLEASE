const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Fetch user subscription data
router.get('/:userId/subscription', auth, async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        subscriptionTier: user.subscriptionTier,
        subscriptionActive: user.subscriptionActive,
        trialEndDate: user.trialEndDate
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Set subscription tier
// Set subscription tier
router.post('/set-subscription-tier', auth, async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.subscriptionTier = tier;
    user.subscriptionActive = true;
    
    if (tier === 'Free') {
      // Set a 30-second trial for testing purposes
      const trialEndDate = new Date();
      trialEndDate.setSeconds(trialEndDate.getSeconds() + 30); // 30-second trial
      user.trialEndDate = trialEndDate;
    } else {
      user.trialEndDate = null;
    }
    
    await user.save();
    res.json({ user });
  } catch (error) {
    console.error('Error setting subscription tier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;