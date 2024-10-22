// backend/src/middleware/verifySubscription.js
const User = require('../models/user');
const Customer = require('../models/customer'); // Import your Customer model
const Job = require('../models/job'); // Import your Job model
// Import other models as necessary

const verifySubscription = (requiredTier) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized. User not found.' });
      }
      
      const currentDate = new Date();
      const isTrialActive = user.subscriptionTier === 'Free' && currentDate < user.trialEndDate;
      
      // If trial is active, grant full access
      if (isTrialActive) {
        return next();
      }

      // If trial has ended for Free Tier, deactivate subscription
      if (user.subscriptionTier === 'Free' && currentDate >= user.trialEndDate) {
        user.subscriptionActive = false;
        await user.save();
        return res.status(403).json({ error: 'Your free trial has ended. Please upgrade to continue using the service.' });
      }

      // Define tier hierarchy
      const tiers = ['Free', 'Basic', 'Pro', 'Enterprise'];
      const userTierIndex = tiers.indexOf(user.subscriptionTier);
      const requiredTierIndex = tiers.indexOf(requiredTier);
      
      if (requiredTierIndex === -1) {
        return res.status(500).json({ error: 'Server error. Invalid required tier.' });
      }
      
      if (userTierIndex === -1) {
        return res.status(403).json({ error: 'Access denied. Invalid subscription tier.' });
      }
      
      if (!user.subscriptionActive && user.subscriptionTier !== 'Free') {
        return res.status(403).json({ error: 'Access denied. Inactive subscription.' });
      }
      
      if (user.subscriptionTier !== 'Free' && user.subscriptionActive && userTierIndex < requiredTierIndex) {
        return res.status(403).json({ error: 'Access denied. Upgrade your subscription tier to access this feature.' });
      }

      next();
    } catch (error) {
      console.error('Error in verifySubscription middleware:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
};

module.exports = verifySubscription;
