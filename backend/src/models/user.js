// backend/src/models/user.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
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
        return !this.googleId;
      },
      select: false,
    },
    googleAccessToken: String,
    googleRefreshToken: String,
    phoneNumber: String,
    customerBaseSize: Number,
    jobTypes: String,
    subscriptionTier: {
      type: String,
      enum: ['Basic', 'Pro', 'Enterprise',null],
      default: 'Basic', // Set default to 'Basic' if that's the starting plan
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
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
    businessInfo: {
      name: String,
      logo: String,
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


// Create index on email
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
