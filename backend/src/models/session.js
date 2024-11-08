const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripeSessionId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: String,
  initialPlan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  metadata: {
    priceId: String,
    productId: String,
    email: String
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Add index for quick lookups
sessionSchema.index({ stripeSessionId: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ status: 1 });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
