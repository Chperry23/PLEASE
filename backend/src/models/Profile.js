// backend/src/models/Profile.js

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number },
  duration: Number
});

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
  },
  badges: [{
    name: String,
    description: String,
    dateEarned: Date,
  }],
  progress: {
    customersAdded: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    revenueEarned: { type: Number, default: 0 },
    routesCreated: { type: Number, default: 0 },
  },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  setupSteps: {
    profileCompleted: { type: Boolean, default: false },
    firstCustomerAdded: { type: Boolean, default: false },
    firstJobCreated: { type: Boolean, default: false },
    firstRouteCreated: { type: Boolean, default: false },
  },
  achievements: {
    type: Map,
    of: Number,
    default: {}
  },
  subscriptionTier: {
    type: String,
    enum: ['Basic', 'Pro', 'Enterprise'], 
    default: null, // Set default to null
  },
  subscriptionActive: {
    type: Boolean,
    default: false,
  },
  stripeCustomerId: {
    type: String,
    default: '',
  },
  stripeSubscriptionId: {
    type: String,
    default: '',
  },
  cancellationRequested: {
    type: Boolean,
    default: false,
  },
  subscriptionEndDate: Date,
  services: [serviceSchema],
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
