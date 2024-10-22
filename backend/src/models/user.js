// backend/src/models/user.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null entries
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password is required if not signing up with Google
      },
      select: false, // Exclude password by default
    },
    googleAccessToken: String,
    googleRefreshToken: String,
    subscriptionTier: {
      type: String,
      enum: ['Free', 'Basic', 'Pro', 'Enterprise'],
      default: 'Free',
    },
    subscriptionActive: {
      // Indicates if subscription is active
      type: Boolean,
      default: true, // Active during trial
    },
    stripeCustomerId: { 
      type: String 
    }, // Store Stripe Customer ID
    stripeSubscriptionId: { 
      type: String 
    }, // Store Stripe Subscription ID
    trialStartDate: {
      // Date when trial started
      type: Date,
      default: Date.now,
    },
    trialEndDate: {
      // Date when trial ends (7 days after start)
      type: Date,
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Employee'],
      default: 'Employee',
    },
    lastLogin: Date,
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
    preferences: {
      theme: {
        type: String,
        default: 'light',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
      },
    },
    // Business Info Field
    businessInfo: {
      name: String,
      logo: String, // Path or URL to the logo image
      address: String,
      phone: String,
      email: String,
      website: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set trialEndDate if not set
userSchema.pre('save', function (next) {
  if (this.subscriptionTier === 'Free' && !this.trialEndDate) {
    // Set trial end date to 30 seconds after trialStartDate for testing
    this.trialEndDate = new Date(this.trialStartDate.getTime() + 30 * 1000); // 30 seconds
  }
  next();
});

// Replace deprecated ensureIndex with createIndexes
userSchema.index({ email: 1 }, { unique: true }); // Example index

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
