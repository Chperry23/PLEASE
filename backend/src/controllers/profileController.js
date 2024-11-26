// profileController.js
const Profile = require('../models/profile');
const User = require('../models/user');

exports.getProfile = async (req, res) => {
  try {
    // Find profile and populate user data with all relevant fields
    let profile = await Profile.findOne({ user: req.user._id }).populate({
      path: 'user',
      select: 'name email phoneNumber customerBaseSize accountStatus subscriptionTier subscriptionActive stripeCustomerId'
    });
    
    // If no profile exists, create one
    if (!profile) {
      profile = new Profile({
        user: req.user._id,
        businessInfo: {
          name: '',
          phone: '',
          website: '',
          address: ''
        }
      });
      await profile.save();
      
      // Fetch again with populated user data
      profile = await Profile.findOne({ user: req.user._id }).populate({
        path: 'user',
        select: 'name email phoneNumber customerBaseSize accountStatus subscriptionTier subscriptionActive stripeCustomerId'
      });
    }

    // Get subscription details using the user model method
    const subscriptionDetails = profile.user.getSubscriptionDetails();

    // Format response
    const response = {
      // User information
      name: profile.user.name,
      email: profile.user.email,
      phoneNumber: profile.user.phoneNumber,
      customerBaseSize: profile.user.customerBaseSize,
      accountStatus: profile.user.accountStatus,
      
      // Business information
      businessInfo: {
        name: profile.businessInfo.name,
        phone: profile.businessInfo.phone,
        website: profile.businessInfo.website,
        address: profile.businessInfo.address
      },

      // Subscription information
      subscription: subscriptionDetails,
      
      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Error fetching profile.', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phoneNumber,
      customerBaseSize,
      businessName, 
      businessPhone, 
      businessWebsite, 
      businessAddress 
    } = req.body;

    // Find or create profile
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Update user information
    const user = await User.findById(req.user._id);
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (customerBaseSize) user.customerBaseSize = customerBaseSize;
      await user.save();
    }

    // Update business information
    profile.businessInfo = {
      name: businessName || profile.businessInfo?.name || '',
      phone: businessPhone || profile.businessInfo?.phone || '',
      website: businessWebsite || profile.businessInfo?.website || '',
      address: businessAddress || profile.businessInfo?.address || ''
    };

    await profile.save();

    // Get subscription details
    const subscriptionDetails = user.getSubscriptionDetails();

    // Format and send response
    const response = {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      customerBaseSize: user.customerBaseSize,
      accountStatus: user.accountStatus,
      businessInfo: profile.businessInfo,
      subscription: subscriptionDetails,
      updatedAt: profile.updatedAt
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Error updating profile.', 
      error: error.message 
    });
  }
};

// Get subscription status using the User model's method
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const subscriptionDetails = user.getSubscriptionDetails();

    res.json({
      hasActiveSubscription: user.hasActiveSubscription(),
      subscriptionDetails: subscriptionDetails
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ 
      message: 'Error fetching subscription information.', 
      error: error.message 
    });
  }
};

module.exports = exports;
