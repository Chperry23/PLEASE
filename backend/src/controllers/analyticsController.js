// backend/src/controllers/analyticsController.js

const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Job = require('../models/job');
const Employee = require('../models/employee');

/**
 * @desc    Fetch counts of customers, jobs, and employees
 * @route   GET /api/analytics/counts
 * @access  Private
 */
const getCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Fetching counts for user ID: ${userId}`);

    const [customerCount, jobCount, employeeCount] = await Promise.all([
      Customer.countDocuments({ createdBy: mongoose.Types.ObjectId(userId) }),
      Job.countDocuments({ createdBy: mongoose.Types.ObjectId(userId) }),
      Employee.countDocuments({ createdBy: mongoose.Types.ObjectId(userId) }),
    ]);

    console.log(`Counts fetched - Customers: ${customerCount}, Jobs: ${jobCount}, Employees: ${employeeCount}`);

    res.json({
      success: true,
      data: {
        customerCount,
        jobCount,
        employeeCount,
      },
    });
  } catch (error) {
    console.error('Error in getCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch counts',
    });
  }
};

/**
 * @desc    Fetch comprehensive analytics data based on date range
 * @route   GET /api/analytics
 * @access  Private
 * @query   timeRange - '7', '30', '90', 'custom'
 *          startDate - Start date in YYYY-MM-DD format (required if timeRange is 'custom')
 *          endDate - End date in YYYY-MM-DD format (required if timeRange is 'custom')
 */
const getAnalyticsData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange, startDate, endDate } = req.query;

    let start, end;

    if (timeRange === 'custom') {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required for custom time range.',
        });
      }

      start = new Date(startDate);
      end = new Date(endDate);

      // Validate date formats
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate or endDate format. Use YYYY-MM-DD.',
        });
      }

      // Set end to the end of the day to include all entries on endDate
      end.setHours(23, 59, 59, 999);
    } else {
      // Parse timeRange as number of days
      const days = parseInt(timeRange);

      if (isNaN(days)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timeRange. It should be a number representing days or "custom".',
        });
      }

      end = new Date(); // Current date and time
      start = new Date();
      start.setDate(end.getDate() - days);
      // Optionally, set time to start of the day
      start.setHours(0, 0, 0, 0);
    }

    console.log(`Fetching analytics data for user ID: ${userId} from ${start.toISOString()} to ${end.toISOString()}`);

    // Fetch revenue over time
    const revenueData = await Job.aggregate([
      {
        $match: {
          createdBy: mongoose.Types.ObjectId(userId),
          status: 'Completed',
          lastServiceDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastServiceDate' } },
          totalRevenue: { $sum: '$price' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Fetch customer growth
    const customerGrowth = await Customer.aggregate([
      {
        $match: {
          createdBy: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Fetch job status distribution
    const jobStatusDistribution = await Job.aggregate([
      {
        $match: {
          createdBy: mongoose.Types.ObjectId(userId),
          lastServiceDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Fetch top performing employees
    const topPerformingEmployees = await Employee.aggregate([
      {
        $match: {
          createdBy: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'jobs', // Collection name in MongoDB is pluralized
          localField: '_id',
          foreignField: 'employee', // Ensure 'employee' field exists in Job model
          as: 'jobs',
        },
      },
      {
        $addFields: {
          jobCount: { $size: '$jobs' },
        },
      },
      {
        $sort: { jobCount: -1 },
      },
      {
        $limit: 5, // Top 5 employees
      },
      {
        $project: {
          name: 1,
          jobCount: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenueData || [],
        customerGrowth: customerGrowth || [],
        jobStatusDistribution: jobStatusDistribution || [],
        topPerformingEmployees: topPerformingEmployees || [],
        // Include other analytics data here
      },
    });
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch analytics data',
    });
  }
};

module.exports = {
  getCounts,
  getAnalyticsData,
};
