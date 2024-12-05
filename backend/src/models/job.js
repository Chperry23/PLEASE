// backend/src/models/job.js

const mongoose = require('mongoose');

/**
 * Job Schema
 * Represents a service job in the application.
 */
const jobSchema = new mongoose.Schema(
  {
    /**
     * Reference to the Customer who requested the job.
     */
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },

    /**
     * Name of the service provided.
     */
    service: {
      type: String,
      required: [true, 'Service is required'],
      trim: true,
    },

    /**
     * Detailed description of the job.
     */
    description: {
      type: String,
      trim: true,
      default: '',
    },

    /**
     * Current status of the job.
     */
    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Canceled'],
      default: 'Pending',
      required: true,
    },

    /**
     * Status of the recurring job.
     */
  // For recurringStatus
    recurringStatus: {
      type: String,
      enum: ['Active', 'Paused', 'Canceled'],
      default: 'Active',
      required: function() {  // Only required if job is recurring
        return this.isRecurring;
      }
    },
    /**
     * Day of the week when the job is scheduled.
     */
    scheduledDay: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
        null,
      ],
      default: null,
    },

    /**
     * Estimated duration of the job in minutes.
     */
    estimatedDuration: {
      type: Number,
      min: [0, 'Estimated duration cannot be negative'],
      default: 0,
    },

    /**
     * Actual duration of the job in minutes.
     */
    actualDuration: {
      type: Number,
      min: [0, 'Actual duration cannot be negative'],
      default: 0,
    },

    /**
     * Location details where the job is to be performed.
     */
    location: {
      address: {
        type: String,
        trim: true,
        default: '',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere', // Enables geospatial queries
        validate: {
          validator: function (v) {
            return v.length === 2;
          },
          message: 'Coordinates must be an array of two numbers [longitude, latitude].',
        },
        required: false,
      },
    },

    /**
     * Price charged for the job.
     */
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    /**
     * Cost incurred for the job.
     */
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: null,
    },

    /**
     * Reference to the User (typically a business owner) who created the job.
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created By is required'],
    },

    /**
     * Reference to the User (typically an employee) assigned to the job.
     */
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /**
     * Indicates whether the job is recurring.
     */
    isRecurring: {
      type: Boolean,
      default: false,
      required: true,
    },

    /**
     * Recurrence pattern for the job.
     * Required if `isRecurring` is true.
     */
// For recurrencePattern
    recurrencePattern: {
      type: String,
      enum: ['Weekly', 'Bi-weekly', 'Monthly', null],  // Add null to enum
      required: function () {
        return this.isRecurring;
      },
      default: null
    },

    /**
     * Date when the last service was performed.
     */
    lastServiceDate: {
      type: Date,
      default: null,
    },

    /**
     * Number of times the recurring job has been completed.
     */
    completionCount: {
      type: Number,
      min: [0, 'Completion count cannot be negative'],
      default: 0,
    },

    /**
     * Customer's rating for the completed job.
     */
    customerRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null,
    },

    /**
     * Additional notes or remarks about the job.
     */
    notes: {
      type: String,
      trim: true,
      default: '',
    },

    /**
     * Date when the next recurring job is scheduled.
     */
    nextScheduledDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Pre-validation middleware to ensure that if a job is recurring,
 * it must have a defined recurrence pattern.
 */
jobSchema.pre('validate', function (next) {
  if (this.isRecurring && !this.recurrencePattern) {
    this.invalidate('recurrencePattern', 'Recurrence pattern is required for recurring jobs');
  }
  next();
});

/**
 * Indexes for optimized query performance.
 * - 2dsphere index on location.coordinates for geospatial queries.
 * - Compound index on createdBy and status for faster filtering.
 */
jobSchema.index({ createdBy: 1, status: 1 });

/**
 * Static method to calculate total revenue within a date range.
 * @param {ObjectId} userId - ID of the user.
 * @param {Date} startDate - Start date.
 * @param {Date} endDate - End date.
 * @returns {Promise<Object>} - Aggregated revenue data.
 */
jobSchema.statics.calculateRevenue = async function (userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdBy: mongoose.Types.ObjectId(userId),
        status: 'Completed',
        completionDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completionDate' } },
        totalRevenue: { $sum: '$price' },
        jobCount: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);
};

/**
 * Virtual field to populate assigned employee details.
 */
jobSchema.virtual('assignedEmployee', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual field to populate creator user details.
 */
jobSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

/**
 * Ensure virtual fields are serialized.
 */
jobSchema.set('toObject', { virtuals: true });
jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
