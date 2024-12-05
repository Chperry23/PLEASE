const mongoose = require('mongoose');

const RouteTagSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  occurrenceId: { type: String, required: true },
  tag: { type: String, required: true },
});

RouteTagSchema.index({ userId: 1, occurrenceId: 1 }, { unique: true });

module.exports = mongoose.model('RouteTag', RouteTagSchema);
