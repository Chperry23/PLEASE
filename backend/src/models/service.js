// backend/src/models/service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  defaultPrice: { type: Number, required: true },
});

module.exports = mongoose.models.Service || mongoose.model('Service', serviceSchema);
