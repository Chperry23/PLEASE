const Route = require('../models/route');
const Job = require('../models/job');
const mongoose = require('mongoose');

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * GET /routes
 * Returns all routes grouped by day of the week.
 * {
 *   "routes": {
 *     "Monday": [ { ...route }, ... ],
 *     "Tuesday": [ { ...route }, ... ],
 *     ...
 *   }
 * }
 */
exports.getAllRoutesGroupedByDay = async (req, res) => {
  try {
    const routes = await Route.find({ createdBy: req.user._id })
      .populate({
        path: 'jobs',
        populate: { path: 'customer', select: 'name' }
      })
      .populate('employee', 'name')
      .populate('crew', 'name')
      .lean();

    const grouped = DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = routes.filter(r => r.dayOfWeek === day);
      return acc;
    }, {});

    res.json({ routes: grouped });
  } catch (error) {
    console.error('Error fetching all routes:', error);
    res.status(500).json({ message: 'Failed to fetch routes', error: error.message });
  }
};

exports.rescheduleSeries = async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;

  const route = await Route.findById(id);
  route.jobs.forEach((job) => {
    job.nextScheduledDate = addDays(new Date(job.nextScheduledDate), delta);
    job.save();
  });

  res.json({ message: 'Series rescheduled successfully.' });
};


/**
 * POST /routes
 * Create a new route with given dayOfWeek and name.
 * Request body: { dayOfWeek: "Monday", name: "Route 1" }
 */
exports.createRoute = async (req, res) => {
  try {
    const { dayOfWeek, name } = req.body;
    if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
      return res.status(400).json({ message: 'Invalid dayOfWeek' });
    }

    const route = await Route.create({
      createdBy: req.user._id,
      dayOfWeek,
      name,
      jobs: []
    });

    res.json({ route });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ message: 'Failed to create route', error: error.message });
  }
};

/**
 * POST /routes/:routeId/jobs
 * Add a job to a route.
 * Request body: { jobId: "someJobId", startDate?: "YYYY-MM-DD" }
 */
exports.addJobToRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { jobId, startDate } = req.body;

    const route = await Route.findOne({ _id: routeId, createdBy: req.user._id });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // If job is recurring and no lastServiceDate is set, use startDate if provided
    if (job.isRecurring && !job.lastServiceDate && startDate) {
      job.lastServiceDate = new Date(startDate);
      await job.save();
    }

    // Add job to route
    route.jobs.push(job._id);
    await route.save();

    res.json({ message: 'Job added to route', route });
  } catch (error) {
    console.error('Error adding job to route:', error);
    res.status(500).json({ message: 'Failed to add job to route', error: error.message });
  }
};

/**
 * POST /routes/:routeId/push
 * Push a route's scheduled jobs forward.
 * Request body: { interval: number, unit: "day" or "week" }
 */
exports.pushRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { interval, unit, adjustRecurrence } = req.body;
    // adjustRecurrence: boolean to decide if pushing route updates future recurrence patterns or just occurrences

    const route = await Route.findOne({ _id: routeId, createdBy: req.user._id }).populate('jobs');
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    let daysToPush = interval;
    if (unit === 'week') {
      daysToPush = interval * 7;
    } else if (unit !== 'day') {
      return res.status(400).json({ message: 'Invalid unit, must be "day" or "week"' });
    }

    // If route is on Monday and we push by 1 day, it becomes Tuesday:
    // Find current index of route.dayOfWeek in DAYS_OF_WEEK, shift by daysToPush mod 7
    const currentIndex = DAYS_OF_WEEK.indexOf(route.dayOfWeek);
    // A simple approach: pushing a route by days might just move its dayOfWeek in a simple manner:
    const newIndex = (currentIndex + daysToPush) % 7;
    route.dayOfWeek = DAYS_OF_WEEK[newIndex];

    // Update each job's lastServiceDate or scheduledDay
    for (const job of route.jobs) {
      if (job.lastServiceDate) {
        const newDate = new Date(job.lastServiceDate);
        newDate.setDate(newDate.getDate() + daysToPush);
        job.lastServiceDate = newDate;
        if (adjustRecurrence && job.isRecurring) {
          // Adjust future occurrences
          // Logic depends on how you define recurrence. For simplicity:
          job.lastServiceDate = newDate;
        }
        await job.save();
      }
    }

    await route.save();
    res.json({ message: 'Route pushed successfully', route });
  } catch (error) {
    console.error('Error pushing route:', error);
    res.status(500).json({ message: 'Failed to push route', error: error.message });
  }
};

/**
 * POST /routes/:routeId/complete
 * Complete all due jobs in the route.
 * This logic depends on how you determine which jobs are "due" on this route's day.
 * For simplicity, let's just mark all jobs in this route as completed.
 */
const { isJobDueOnDate } = require('../utils/recurrence');

exports.completeRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { date } = req.body; // Expect a date parameter to know which occurrence is being completed.
    if (!date) return res.status(400).json({ message: 'date parameter is required' });

    const route = await Route.findOne({ _id: routeId, createdBy: req.user._id }).populate('jobs');
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const targetDate = new Date(date);
    const dueJobs = route.jobs.filter(job => isJobDueOnDate(job, targetDate));

    const dueJobIds = dueJobs.map(j => j._id);
    await Job.updateMany(
      { _id: { $in: dueJobIds } },
      { $set: { status: 'Completed', lastServiceDate: new Date() }, $inc: { completionCount: 1 } }
    );

    // Remove one-time completed jobs from route
    const completedOneTimeJobIds = dueJobs
      .filter(j => !j.isRecurring)
      .map(j => j._id.toString());

    route.jobs = route.jobs.filter(j => !completedOneTimeJobIds.includes(j._id.toString()));
    await route.save();

    res.json({ message: 'Route completed successfully', completedCount: dueJobIds.length });
  } catch (error) {
    res.status(500).json({ message: 'Error completing route', error: error.message });
  }
};

/**
 * PUT /routes/:routeId/reschedule
 * Change the route's dayOfWeek.
 * Request body: { dayOfWeek: "Tuesday" }
 */
exports.rescheduleRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { dayOfWeek } = req.body;

    if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
      return res.status(400).json({ message: 'Invalid dayOfWeek' });
    }

    const route = await Route.findOne({ _id: routeId, createdBy: req.user._id });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    route.dayOfWeek = dayOfWeek;
    await route.save();

    res.json({ message: 'Route rescheduled successfully', route });
  } catch (error) {
    console.error('Error rescheduling route:', error);
    res.status(500).json({ message: 'Error rescheduling route', error: error.message });
  }
};

/**
 * PUT /routes/:routeId/assign
 * Assign an employee or crew to a route.
 * Request body: { employee: "employeeId" } or { crew: "crewId" }
 */
exports.assignRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { employee, crew } = req.body;

    const route = await Route.findOne({ _id: routeId, createdBy: req.user._id });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (employee) {
      route.employee = employee;
      route.crew = null;
    } else if (crew) {
      route.crew = crew;
      route.employee = null;
    } else {
      return res.status(400).json({ message: 'Must provide employee or crew ID' });
    }

    await route.save();

    const populated = await Route.findById(route._id)
      .populate({
        path: 'jobs',
        populate: { path: 'customer', select: 'name' }
      })
      .populate('employee', 'name')
      .populate('crew', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error assigning route:', error);
    res.status(500).json({ message: 'Error assigning route', error: error.message });
  }
};

/**
 * DELETE /routes/:routeId
 * Delete a route by ID.
 * If you want to return jobs to job pool or perform other cleanup, do it here.
 */
exports.deleteRouteById = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findOneAndDelete({ _id: routeId, createdBy: req.user._id });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // If you want to update jobs that were on this route to become unscheduled, do so:
    // For example:
    // await Job.updateMany(
    //   { _id: { $in: route.jobs } },
    //   { $set: { scheduledDay: null } }
    // );

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Failed to delete route', error: error.message });
  }
};
