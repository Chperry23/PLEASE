const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lawncare', 'hedge_trimming', 'landscaping'],
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  options: {
    type: Object,
    required: true
  },
  timeEstimate: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Difficult'],
    required: true
  },
  skillRequired: {
    type: String,
    enum: ['Basic', 'Intermediate', 'Expert'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  weightedPrice: {
    type: Number,
    required: true
  },
  additionalPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  customerInfo: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  quoteIdentifier: {
    type: String,
    unique: true,
    required: true
  },
  quoteStatus: {
    type: String,
    enum: ['Waiting', 'Accepted', 'Denied'],
    default: 'Waiting'
  },
  isConverted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }
}, {
  timestamps: true
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;