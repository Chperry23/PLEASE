const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  index: {
    type: Number,
    required: true
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
    ref: 'Employee'
  },
  crew: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crew'
  }
}, { timestamps: true });

module.exports = mongoose.models.Route || mongoose.model('Route', routeSchema);
