const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Employee', 'Manager'],
    default: 'Admin'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  customerBaseSize: {
    type: Number
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  preferences: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  subscriptionTier: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'], // Remove null from enum array
    required: false
  },
  subscriptionActive: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  return this.subscriptionActive && this.subscriptionTier;
};

// Method to get subscription details
userSchema.methods.getSubscriptionDetails = function() {
  if (!this.subscriptionActive) {
    return null;
  }
  
  return {
    tier: this.subscriptionTier,
    active: this.subscriptionActive,
    customerId: this.stripeCustomerId,
    subscriptionId: this.stripeSubscriptionId
  };
};

// Create the model
const User = mongoose.model('User', userSchema);

// Export the model
module.exports = User;
