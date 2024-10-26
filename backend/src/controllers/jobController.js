const Job = require('../models/job');
const Customer = require('../models/customer');
const Profile = require('../models/profile');

// Create a new job
exports.createJob = async (req, res) => {
  console.log('Received job data:', req.body);
  try {
    const jobData = { ...req.body, createdBy: req.user._id };
    console.log('Processed job data:', jobData);
    
    // Remove scheduledDay if it's null, undefined, or an empty string
    if (!jobData.scheduledDay) {
      delete jobData.scheduledDay;
    }

    if (!jobData.isRecurring) {
      delete jobData.recurrencePattern;
    } else if (!jobData.recurrencePattern) {
      console.log('Recurring job missing recurrence pattern');
      return res.status(400).json({ message: 'Recurrence pattern is required for recurring jobs' });
    }

    console.log('Final job data before creation:', jobData);

    const job = new Job(jobData);
    await job.save();

    // Update profile progress
    const profile = await Profile.findOne({ user: req.user._id });
    if (profile && !profile.setupSteps.firstJobCreated) {
      profile.setupSteps.firstJobCreated = true;
      profile.experience += 25;
      profile.level = Math.floor(profile.experience / 1000) + 1;
      await profile.save();
    }

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get all jobs for the current user
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).populate('customer', 'name email').populate('assignedTo', 'name email');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single job by ID
exports.getJob = async (req, res) => {
  try {
    const { filter } = req.query;
    let query = { createdBy: req.user._id };

    if (filter && filter !== 'All') {
      if (['Active', 'Paused'].includes(filter)) {
        query.isRecurring = true;
        query.recurringStatus = filter;
      } else if (filter === 'Canceled') {
        query.$or = [
          { isRecurring: true, recurringStatus: 'Canceled' },
          { isRecurring: false, status: 'Canceled' }
        ];
      } else {
        query.isRecurring = false;
        query.status = filter;
      }
    }

    const jobs = await Job.find(query).populate('customer', 'name');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a job by ID
exports.updateJob = async (req, res) => {
  console.log('Routes received for update:', req.body.routes);
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Convert empty string to null for scheduledDay
    if (req.body.scheduledDay === '') {
      req.body.scheduledDay = null;
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        job[key] = req.body[key];
      }
    });

    // Handle recurrence-specific logic
    if (job.isRecurring && req.body.status === 'Canceled') {
      job.recurringStatus = 'Canceled';
    }

    // Handle one-time job specifics
    if (!job.isRecurring) {
      job.recurrencePattern = undefined;
      job.recurringStatus = undefined;
    }

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(400).json({ message: error.message });
  }
};


// Delete a job by ID
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a job as complete
exports.completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.isRecurring) {
      job.completionCount += 1;
      job.lastServiceDate = new Date();
    } else {
      if (job.status === 'Completed') {
        return res.status(400).json({ message: 'This one-time job is already completed' });
      }
      job.status = 'Completed';
      job.completionCount = 1;
      job.lastServiceDate = new Date();
      job.recurrencePattern = undefined;
      job.recurringStatus = undefined;
    }

    const updatedJob = await job.save();

    // Update profile progress
    const profile = await Profile.findOne({ user: req.user._id });
    profile.progress.jobsCompleted += 1;
    profile.progress.revenueEarned += job.price || 0;
    profile.experience += 10;
    profile.level = Math.floor(profile.experience / 1000) + 1;
    await profile.save();

    res.json(updatedJob);
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ message: error.message });
  }
};


// Rate a job
exports.rateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!req.body.rating || typeof req.body.rating !== 'number' || req.body.rating < 1 || req.body.rating > 5) {
      return res.status(400).json({ message: 'Invalid rating. Please provide a number between 1 and 5.' });
    }

    job.customerRating = req.body.rating;
    const updatedJob = await job.save();

    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: 'Error rating job', error: error.message });
  }
};

// Get available jobs (jobs that are not yet scheduled)
exports.getAvailableJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      createdBy: req.user._id,
      status: { $in: ['Pending', 'Scheduled'] },
      scheduledDay: null
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available jobs', error: error.message });
  }
};

// Update the schedule of a job
exports.updateJobSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDay, route } = req.body;

    const job = await Job.findByIdAndUpdate(
      id,
      { scheduledDay, route },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error updating job schedule', error: error.message });
  }
};

// Get recent jobs (for dashboard)
exports.getRecentJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name');

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent jobs', error: error.message });
  }
};

// Get jobs for a specific day
exports.getJobsByDay = async (req, res) => {
  try {
    const jobs = await Job.find({
      createdBy: req.user._id,
      scheduledDay: req.params.day
    }).populate('customer', 'name email');

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs by day', error: error.message });
  }
};
