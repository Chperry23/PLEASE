// src/middleware/verifySubscription.js

const verifySubscription = (requiredTier) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized. User not found.' });
      }

      const tiers = ['basic', 'pro', 'enterprise'];
      const userTierIndex = tiers.indexOf(user.subscriptionTier?.toLowerCase());
      const requiredTierIndex = tiers.indexOf(requiredTier.toLowerCase());
      
      if (requiredTierIndex === -1) {
        return res.status(500).json({ error: 'Server error. Invalid required tier.' });
      }
      
      if (userTierIndex === -1) {
        return res.status(403).json({ error: 'Access denied. Invalid subscription tier.' });
      }
      
      if (!user.subscriptionActive) {
        return res.status(403).json({ error: 'Access denied. Inactive subscription.' });
      }
      
      if (userTierIndex < requiredTierIndex) {
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
