const mongoose = require('mongoose');

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const routeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: DAYS_OF_WEEK
  },
  name: {
    type: String,
    required: true,
  },
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  crew: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crew',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.models.Route || mongoose.model('Route', routeSchema);
