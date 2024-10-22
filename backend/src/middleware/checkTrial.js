// backend/src/middleware/checkTrial.js
const User = require('../models/user');

const checkTrial = () => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized. User not found.' });
      }

      const currentDate = new Date();

      // Check if the user is on the Free Tier
      if (user.subscriptionTier === 'Free') {
        // Check if trial is still active
        if (currentDate < user.trialEndDate) {
          // Trial is active; allow access
          return next();
        } else {
          // Trial has ended; deactivate subscription and deny access
          user.subscriptionActive = false;
          await user.save();
          return res.status(403).json({ error: 'Your free trial has ended. Please upgrade to continue using the service.' });
        }
      }

      // For other subscription tiers, implement as needed
      // For now, allow access if subscription is active
      if (user.subscriptionActive) {
        return next();
      } else {
        return res.status(403).json({ error: 'Access denied. Please activate your subscription.' });
      }
    } catch (error) {
      console.error('Error in checkTrial middleware:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
};

module.exports = checkTrial;
