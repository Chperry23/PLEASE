const Profile = require('../models/profile');
const User = require('../models/user');

exports.getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id }).populate({
      path: 'user',
      select: 'name email businessInfo'
    });
    
    console.log('Fetched profile:', profile);

    if (!profile) {
      profile = new Profile({
        user: req.user._id,
        bio: '',
        address: { street: '', city: '', state: '', zipCode: '' },
      });
      await profile.save();
      profile = await Profile.findOne({ user: req.user._id }).populate({
        path: 'user',
        select: 'name email businessInfo'
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ error: 'Server error.', details: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { bio, address, name, email, businessName, businessPhone, businessWebsite, businessAddress } = req.body;

  console.log('Received data:', req.body);

  try {
    // **Add the code here to prevent modification of subscription fields**
    delete req.body.subscriptionTier;
    delete req.body.subscriptionActive;

    let profile = await Profile.findOne({ user: req.user._id });
    let user = await User.findById(req.user._id);

    console.log('Found profile:', profile);
    console.log('Found user:', user);

    if (!profile) {
      profile = new Profile({ user: req.user._id });
      console.log('Created new profile:', profile);
    }

    // Update profile fields
    profile.bio = bio || profile.bio;

    // Handle address update safely
    if (address) {
      profile.address = {
        street: address.street || profile.address.street || '',
        city: address.city || profile.address.city || '',
        state: address.state || profile.address.state || '',
        zipCode: address.zipCode || profile.address.zipCode || '',
      };
    }

    // Update user fields
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;

      // Update user's business info
      user.businessInfo = {
        name: businessName || user.businessInfo?.name || '',
        phone: businessPhone || user.businessInfo?.phone || '',
        website: businessWebsite || user.businessInfo?.website || '',
        address: businessAddress || user.businessInfo?.address || '',
      };
    }

    console.log('Updated profile before save:', profile);
    console.log('Updated user before save:', user);

    await profile.save();
    if (user) await user.save();

    console.log('Profile after save:', profile);
    console.log('User after save:', user);

    // Fetch the updated profile with populated user data
    const updatedProfile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'email']);

    console.log('Final updatedProfile:', updatedProfile);

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error.', details: error.message });
  }
};


exports.updateProgress = async (req, res) => {
    const { customersAdded, jobsCompleted, revenueEarned, routesCreated } = req.body;
  
    try {
      let profile = await Profile.findOne({ user: req.user._id });
  
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
  
      // Update progress
      if (customersAdded) profile.progress.customersAdded += customersAdded;
      if (jobsCompleted) profile.progress.jobsCompleted += jobsCompleted;
      if (revenueEarned) profile.progress.revenueEarned += revenueEarned;
      if (routesCreated) profile.progress.routesCreated += routesCreated;
  
      // Check for milestones and award badges
      
      // Customer Milestones
      if (profile.progress.customersAdded >= 5 && !profile.badges.some(b => b.name === 'Customer Starter')) {
        profile.badges.push({
          name: 'Customer Starter',
          description: 'Added 5 customers',
          dateEarned: new Date(),
        });
        profile.experience += 50;
      }
      
      if (profile.progress.customersAdded >= 10 && !profile.badges.some(b => b.name === 'Customer Magnet')) {
        profile.badges.push({
          name: 'Customer Magnet',
          description: 'Added 10 customers',
          dateEarned: new Date(),
        });
        profile.experience += 100;
      }
  
      if (profile.progress.customersAdded >= 50 && !profile.badges.some(b => b.name === 'Customer Pro')) {
        profile.badges.push({
          name: 'Customer Pro',
          description: 'Added 50 customers',
          dateEarned: new Date(),
        });
        profile.experience += 300;
      }
  
      if (profile.progress.customersAdded >= 100 && !profile.badges.some(b => b.name === 'Customer Legend')) {
        profile.badges.push({
          name: 'Customer Legend',
          description: 'Added 100 customers',
          dateEarned: new Date(),
        });
        profile.experience += 500;
      }
  
      // Job Milestones
      if (profile.progress.jobsCompleted >= 10 && !profile.badges.some(b => b.name === 'Job Novice')) {
        profile.badges.push({
          name: 'Job Novice',
          description: 'Completed 10 jobs',
          dateEarned: new Date(),
        });
        profile.experience += 50;
      }
  
      if (profile.progress.jobsCompleted >= 50 && !profile.badges.some(b => b.name === 'Job Master')) {
        profile.badges.push({
          name: 'Job Master',
          description: 'Completed 50 jobs',
          dateEarned: new Date(),
        });
        profile.experience += 200;
      }
  
      if (profile.progress.jobsCompleted >= 100 && !profile.badges.some(b => b.name === 'Job Expert')) {
        profile.badges.push({
          name: 'Job Expert',
          description: 'Completed 100 jobs',
          dateEarned: new Date(),
        });
        profile.experience += 400;
      }
  
      // Revenue Milestones
      if (profile.progress.revenueEarned >= 1000 && !profile.badges.some(b => b.name === 'Revenue Riser')) {
        profile.badges.push({
          name: 'Revenue Riser',
          description: 'Earned $1,000 in revenue',
          dateEarned: new Date(),
        });
        profile.experience += 100;
      }
  
      if (profile.progress.revenueEarned >= 5000 && !profile.badges.some(b => b.name === 'Revenue Achiever')) {
        profile.badges.push({
          name: 'Revenue Achiever',
          description: 'Earned $5,000 in revenue',
          dateEarned: new Date(),
        });
        profile.experience += 300;
      }
  
      if (profile.progress.revenueEarned >= 10000 && !profile.badges.some(b => b.name === 'Revenue Champion')) {
        profile.badges.push({
          name: 'Revenue Champion',
          description: 'Earned $10,000 in revenue',
          dateEarned: new Date(),
        });
        profile.experience += 500;
      }
  
      // Route Milestones
      if (profile.progress.routesCreated >= 5 && !profile.badges.some(b => b.name === 'Route Explorer')) {
        profile.badges.push({
          name: 'Route Explorer',
          description: 'Created 5 routes',
          dateEarned: new Date(),
        });
        profile.experience += 100;
      }
  
      if (profile.progress.routesCreated >= 10 && !profile.badges.some(b => b.name === 'Route Planner')) {
        profile.badges.push({
          name: 'Route Planner',
          description: 'Created 10 routes',
          dateEarned: new Date(),
        });
        profile.experience += 200;
      }
  
      if (profile.progress.routesCreated >= 50 && !profile.badges.some(b => b.name === 'Route Strategist')) {
        profile.badges.push({
          name: 'Route Strategist',
          description: 'Created 50 routes',
          dateEarned: new Date(),
        });
        profile.experience += 500;
      }
  
      // Update level based on experience
      profile.level = Math.floor(profile.experience / 1000) + 1;
  
      await profile.save();
  
      res.json(profile);
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  };
  
  // Add this to your profileController.js

exports.trackAchievement = async (req, res) => {
  const { achievementType, value } = req.body;

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Initialize achievements if not exist
    if (!profile.achievements) {
      profile.achievements = {};
    }

    // Update or initialize the specific achievement
    profile.achievements[achievementType] = (profile.achievements[achievementType] || 0) + value;

    // Check for milestones and award badges
    switch(achievementType) {
      case 'jobsCompleted':
        if (profile.achievements[achievementType] >= 100 && !profile.badges.some(b => b.name === 'Century Worker')) {
          profile.badges.push({
            name: 'Century Worker',
            description: 'Completed 100 jobs',
            dateEarned: new Date(),
          });
          profile.experience += 500;
        }
        break;
      case 'revenueEarned':
        if (profile.achievements[achievementType] >= 10000 && !profile.badges.some(b => b.name === 'Cash Flow Master')) {
          profile.badges.push({
            name: 'Cash Flow Master',
            description: 'Earned $10,000 in revenue',
            dateEarned: new Date(),
          });
          profile.experience += 1000;
        }
        break;
      // Add more cases for different achievement types
    }

    // Update level based on experience
    profile.level = Math.floor(profile.experience / 1000) + 1;

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error('Error tracking achievement:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.addService = async (req, res) => {
    console.log('Received request to add service:', req.body);
    console.log('User ID:', req.user._id);
    try {
      const profile = await Profile.findOne({ user: req.user._id });
      if (!profile) {
        console.log('Profile not found for user:', req.user._id);
        return res.status(404).json({ error: 'Profile not found.' });
      }
  
      const newService = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        duration: req.body.duration
      };
  
      if (!profile.services) {
        console.log('Services array not found, initializing...');
        profile.services = [];
      }
  
      profile.services.push(newService);
      await profile.save();
  
      console.log('Service added successfully:', newService);
      res.status(201).json(profile.services);
    } catch (error) {
      console.error('Error adding service:', error);
      res.status(500).json({ error: 'Error adding service.', details: error.message });
    }
  };
  
  exports.getServices = async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
  
      res.json(profile.services);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching services.' });
    }
  };
  
  exports.updateService = async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
  
      const serviceIndex = profile.services.findIndex(s => s._id.toString() === req.params.serviceId);
      if (serviceIndex === -1) {
        return res.status(404).json({ error: 'Service not found.' });
      }
  
      profile.services[serviceIndex] = { ...profile.services[serviceIndex], ...req.body };
      await profile.save();
  
      res.json(profile.services[serviceIndex]);
    } catch (error) {
      res.status(500).json({ error: 'Error updating service.' });
    }
  };
  
  exports.deleteService = async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
  
      profile.services = profile.services.filter(s => s._id.toString() !== req.params.serviceId);
      await profile.save();
  
      res.json({ message: 'Service deleted successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting service.' });
    }
  };

exports.updateSetupSteps = async (req, res) => {
  const { step } = req.body;

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Update the specific setup step
    if (step in profile.setupSteps) {
      profile.setupSteps[step] = true;

      // Award experience for completing a setup step
      profile.experience += 25;

      // Check if all setup steps are completed
      const allStepsCompleted = Object.values(profile.setupSteps).every(step => step === true);
      if (allStepsCompleted && !profile.badges.some(b => b.name === 'Setup Superstar')) {
        profile.badges.push({
          name: 'Setup Superstar',
          description: 'Completed all setup steps',
          dateEarned: new Date(),
        });
        profile.experience += 150;
      }

      // Update level based on experience
      profile.level = Math.floor(profile.experience / 1000) + 1;

      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    console.error('Error updating setup steps:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = exports;
