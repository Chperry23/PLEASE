const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crew: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crew',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  terminationDate: {
    type: Date
  },
  jobsCompleted: {
    type: Number,
    default: 0
  },
  totalHoursWorked: {
    type: Number,
    default: 0
  },
  averageJobRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);