const mongoose = require('mongoose');
const Route = require('../models/route');
const Job = require('../models/job');
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultRoutes = {
  Monday: [[]],
  Tuesday: [[]],
  Wednesday: [[]],
  Thursday: [[]],
  Friday: [[]],
  Saturday: [[]],
  Sunday: [[]],
};

// Function to get all routes
// In routeController.js

exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ createdBy: req.user._id })
      .populate({
        path: 'jobs',
        match: { status: { $ne: 'Completed' } },
        populate: { path: 'customer', select: 'name' }
      })
      .populate('employee', 'name')
      .populate('crew', 'name')
      .lean();

    const formattedRoutes = DAYS_OF_WEEK.reduce((acc, day) => {
      const dayRoutes = routes.filter(route => route.day === day);
      acc[day] = dayRoutes.map(route => ({
        index: route.index,
        name: route.name,
        jobs: route.jobs,
        employee: route.employee,
        crew: route.crew,
      }));
      return acc;
    }, {});

    res.json({ routes: formattedRoutes });
  } catch (error) {
    console.error('Error in getRoutes:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.rescheduleRoute = async (req, res) => {
  try {
    const routeId = req.params.id;
    const { dayOfWeek } = req.body; // e.g., 'Tuesday'

    if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
      return res.status(400).json({ message: 'Invalid day of the week' });
    }

    const route = await Route.findOne({ _id: routeId, createdBy: req.user._id });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const oldDay = route.day;
    route.day = dayOfWeek;

    // Adjust the route index for the new day
    const maxIndex = await Route.countDocuments({ createdBy: req.user._id, day: dayOfWeek });
    route.index = maxIndex;

    await route.save();

    // Adjust indexes of remaining routes on the old day
    await Route.updateMany(
      { createdBy: req.user._id, day: oldDay, index: { $gt: route.index } },
      { $inc: { index: -1 } }
    );

    res.json({ message: 'Route rescheduled successfully', route });
  } catch (error) {
    console.error('Error rescheduling route:', error);
    res.status(500).json({ message: 'Error rescheduling route', error: error.message });
  }
};

exports.getAvailableJobs = async (req, res) => {
  try {
    console.log('Fetching available jobs');
    
    // Find all routes to exclude already scheduled jobs
    const routes = await Route.find({ createdBy: req.user._id });
    const scheduledJobIds = routes.flatMap(route => route.jobs);

    const now = new Date();
    
    // Find jobs that meet the criteria for the job pool
    const jobs = await Job.find({
      createdBy: req.user._id,
      _id: { $nin: scheduledJobIds },
      status: { $in: ['Pending', 'Scheduled'] },
      $or: [
        { isRecurring: false },
        {
          isRecurring: true,
          recurrencePattern: 'Weekly',
          lastServiceDate: { $lt: new Date(now - 3 * 24 * 60 * 60 * 1000) }
        },
        {
          isRecurring: true,
          recurrencePattern: 'Bi-weekly',
          lastServiceDate: { $lt: new Date(now - 10 * 24 * 60 * 60 * 1000) }
        },
        {
          isRecurring: true,
          recurrencePattern: 'Monthly',
          lastServiceDate: { $lt: new Date(now - 25 * 24 * 60 * 60 * 1000) }
        }
      ]
    }).populate('customer', 'name');

    console.log('Available jobs:', JSON.stringify(jobs, null, 2));
    res.json(jobs);
  } catch (error) {
    console.error('Error in getAvailableJobs:', error);
    res.status(500).json({ message: 'Error fetching available jobs', error: error.message });
  }
};

// Function to get routes for a specific day
exports.getRouteByDay = async (req, res) => {
  try {
    console.log(`Fetching routes for day: ${req.params.day}`);
    const routes = await Route.find({ createdBy: req.user._id, day: req.params.day }).populate({
      path: 'jobs',
      populate: { path: 'customer', select: 'name' }
    });
    console.log(`Routes for ${req.params.day}:`, JSON.stringify(routes, null, 2));
    res.json(routes.length ? routes : [{ day: req.params.day, jobs: [] }]);
  } catch (error) {
    console.error('Error in getRouteByDay:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const { day, index } = req.params;
    console.log(`Deleting route for day: ${day}, index: ${index}`);
    
    const deletedRoute = await Route.findOneAndDelete({
      createdBy: req.user._id,
      day,
      index: parseInt(index, 10),
    });

    if (!deletedRoute) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Update indexes of remaining routes
    await Route.updateMany(
      {
        createdBy: req.user._id,
        day,
        index: { $gt: parseInt(index, 10) },
      },
      { $inc: { index: -1 } }
    );

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error in deleteRoute:', error);
    res.status(500).json({ message: 'Failed to delete route', error: error.message });
  }
};

// Function to update a specific route
exports.updateRoute = async (req, res) => {
  try {
    console.log(`Updating route for day: ${req.params.day}, index: ${req.params.index}`);
    const { jobs, employee, crew, name } = req.body;  // Use 'name' instead of 'routeName'
    const { day, index } = req.params;

    if (!Array.isArray(jobs)) {
      return res.status(400).json({ message: 'Invalid jobs data' });
    }

    // Find the route by day and index
    let route = await Route.findOne({ createdBy: req.user._id, day, index: parseInt(index, 10) });

    if (!route) {
      // Create a new route if none exists
      route = new Route({
        createdBy: req.user._id,
        day,
        index: parseInt(index, 10),
        jobs: jobs.map(job => job._id || job),
        employee: employee || null,
        crew: crew || null,
        name: name || `Route ${index}`, // Use 'name' here
      });
    } else {
      // Update the existing route
      route.jobs = jobs.map(job => job._id || job);
      route.employee = employee || null;
      route.crew = crew || null;
      route.name = name || route.name;  // Use 'name' instead of 'routeName'
    }

    // Save the route
    await route.save();
    console.log('Updated route:', JSON.stringify(route, null, 2));
    res.json(route);
  } catch (error) {
    console.error('Error in updateRoute:', error);
    res.status(500).json({ message: error.message });
  }
};


// Function to complete a route
exports.completeRoute = async (req, res) => {
  try {
    console.log(`Completing route for day: ${req.params.day}, index: ${req.params.routeIndex}`);
    const { day, routeIndex } = req.params;
    const route = await Route.findOne({ createdBy: req.user._id, day, index: routeIndex });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const updateResult = await Job.updateMany(
      { _id: { $in: route.jobs } },
      { 
        $set: { status: 'Completed', lastServiceDate: new Date() },
        $inc: { completionCount: 1 }
      }
    );

    route.jobs = [];
    await route.save();

    console.log(`Completed route. Updated ${updateResult.nModified} jobs.`);
    res.json({ message: 'Route completed successfully' });
  } catch (error) {
    console.error('Error in completeRoute:', error);
    res.status(500).json({ message: 'Error completing route', error: error.message });
  }
};

exports.assignRoute = async (req, res) => {
  try {
    const { day, index } = req.params;
    const { employee, crew } = req.body;

    if (!employee && !crew) {
      return res.status(400).json({ message: 'Either employee or crew must be provided' });
    }

    let route = await Route.findOne({ createdBy: req.user._id, day, index: parseInt(index, 10) });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (employee) {
      route.employee = employee;
      route.crew = null;
    } else if (crew) {
      route.crew = crew;
      route.employee = null;
    }

    await route.save();

    // Populate the route with job details and customer information
    route = await Route.findById(route._id)
      .populate({
        path: 'jobs',
        populate: { path: 'customer', select: 'name' }
      })
      .populate('employee', 'name')
      .populate('crew', 'name');

    console.log(`Route assigned: day ${day}, index ${index}, employee: ${employee}, crew: ${crew}`);
    res.json(route);
  } catch (error) {
    console.error('Error in assignRoute:', error);
    res.status(500).json({ message: 'Error assigning route', error: error.message });
  }
};

// Function to update all routes (with transaction)
exports.updateAllRoutes = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Starting updateAllRoutes transaction');
    const { routes } = req.body;
    console.log('Received routes data:', JSON.stringify(routes, null, 2));

    if (typeof routes !== 'object' || routes === null) {
      throw new Error('Invalid routes data');
    }

    // Delete all existing routes for this user
    await Route.deleteMany({ createdBy: req.user._id }, { session });

    for (const [day, dayRoutes] of Object.entries(routes)) {
      console.log(`Processing routes for ${day}`);
      
      for (let i = 0; i < dayRoutes.length; i++) {
        const routeData = dayRoutes[i];
        const jobIds = Array.isArray(routeData?.jobs) ? routeData.jobs : [];
        
        console.log(`Creating route for ${day}, index ${i}, jobs:`, jobIds);
    
        const newRoute = {
          createdBy: req.user._id,
          day,
          index: i,
          name: routeData.name || `Route ${i + 1}`, // Add default name if not provided
          jobs: jobIds,
          employee: routeData.employee || null,
          crew: routeData.crew || null
        };

        console.log(`New route data:`, JSON.stringify(newRoute, null, 2));

        try {
          await Route.create([newRoute], { session });
        } catch (routeError) {
          console.error(`Error creating route:`, routeError);
          throw routeError;
        }
      }
    }

    // Update all jobs to remove scheduledDay if they're not in any route
    const allScheduledJobIds = Object.values(routes)
      .flat()
      .flatMap(route => Array.isArray(route.jobs) ? route.jobs : []);

    console.log('Updating unscheduled jobs');
    await Job.updateMany(
      { 
        createdBy: req.user._id, 
        _id: { $nin: allScheduledJobIds }
      },
      { $set: { scheduledDay: null } },
      { session }
    );

    await session.commitTransaction();
    console.log('Transaction committed successfully');
    res.json({ message: 'Routes and job pool updated successfully' });
  } catch (error) {
    console.error('Error in updateAllRoutes:', error);
    await session.abortTransaction();
    res.status(500).json({ message: 'Failed to update routes and job pool', error: error.message });
  } finally {
    session.endSession();
  }
};
