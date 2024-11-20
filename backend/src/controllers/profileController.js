// profileController.js
const Profile = require('../models/profile');
const User = require('../models/user');

exports.getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id }).populate({
      path: 'user',
      select: 'name email'
    });
    
    if (!profile) {
      profile = new Profile({
        user: req.user._id,
        businessInfo: {}
      });
      await profile.save();
      profile = await Profile.findOne({ user: req.user._id }).populate({
        path: 'user',
        select: 'name email'
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.updateProfile = async (req, res) => {
  const { 
    name, 
    email, 
    businessName, 
    businessPhone, 
    businessWebsite, 
    businessAddress 
  } = req.body;

  try {
    let profile = await Profile.findOne({ user: req.user._id });
    let user = await User.findById(req.user._id);

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    if (user) {
      // Update user basic info
      if (name) user.name = name;
      if (email) user.email = email;
    }

    // Update business info
    profile.businessInfo = {
      name: businessName || profile.businessInfo?.name || '',
      phone: businessPhone || profile.businessInfo?.phone || '',
      website: businessWebsite || profile.businessInfo?.website || '',
      address: businessAddress || profile.businessInfo?.address || '',
    };

    await Promise.all([
      profile.save(),
      user ? user.save() : Promise.resolve()
    ]);

    const updatedProfile = await Profile.findOne({ user: req.user._id })
      .populate('user', ['name', 'email']);

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Service management functions can stay the same as they are already well-structured
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

exports.addService = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const newService = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      duration: req.body.duration
    };

    if (!profile.services) {
      profile.services = [];
    }

    profile.services.push(newService);
    await profile.save();

    res.status(201).json(profile.services);
  } catch (error) {
    res.status(500).json({ error: 'Error adding service.' });
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

module.exports = exports;
