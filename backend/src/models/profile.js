// Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  businessInfo: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  services: [
    {
      name: { type: String },
      description: { type: String },
      price: { type: Number },
      duration: { type: Number },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
