const Job = require('../models/job');
const Customer = require('../models/customer');
const Employee = require('../models/employee');

const getCustomerGrowth = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const customerGrowth = await Customer.aggregate([
    { $match: { createdBy: userId, createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const labels = customerGrowth.map(item => {
    const date = new Date(2023, item._id - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  });
  const data = customerGrowth.map(item => item.count);

  return { labels, data };
};

const getRevenue = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const revenue = await Job.aggregate([
    { $match: { createdBy: userId, createdAt: { $gte: sixMonthsAgo }, status: 'Completed' } },
    { $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$price" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const labels = revenue.map(item => {
    const date = new Date(2023, item._id - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  });
  const data = revenue.map(item => item.total);

  return { labels, data };
};

const getAverageJobCost = async (userId) => {
  const averageJobCost = await Job.aggregate([
    { $match: { createdBy: userId, status: 'Completed' } },
    { $group: {
        _id: "$serviceType",
        averageCost: { $avg: "$price" }
      }
    },
    { $sort: { averageCost: -1 } },
    { $limit: 3 }
  ]);

  const labels = averageJobCost.map(item => item._id);
  const data = averageJobCost.map(item => item.averageCost);

  return { labels, data };
};

const getJobStatus = async (userId) => {
  const jobStatus = await Job.aggregate([
    { $match: { createdBy: userId } },
    { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const labels = jobStatus.map(item => item._id);
  const data = jobStatus.map(item => item.count);

  return { labels, data };
};

const getEmployeeDistribution = async (userId) => {
  // Assuming you have a 'crew' field in the Employee model
  const employeeDistribution = await Employee.aggregate([
    { $match: { createdBy: userId } },
    { $group: {
        _id: "$crew",
        count: { $sum: 1 }
      }
    }
  ]);

  const labels = employeeDistribution.map(item => item._id || 'Unassigned');
  const data = employeeDistribution.map(item => item.count);

  return { labels, data };
};

const getTopServices = async (userId) => {
  const topServices = await Job.aggregate([
    { $match: { createdBy: userId, status: 'Completed' } },
    { $group: {
        _id: "$serviceType",
        totalRevenue: { $sum: "$price" }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 3 }
  ]);

  const labels = topServices.map(item => item._id);
  const data = topServices.map(item => item.totalRevenue);

  return { labels, data };
};

exports.getAnalytics = async (userId) => {
  return {
    customerGrowth: await getCustomerGrowth(userId),
    revenue: await getRevenue(userId),
    averageJobCost: await getAverageJobCost(userId),
    jobStatus: await getJobStatus(userId),
    employeeDistribution: await getEmployeeDistribution(userId),
    topServices: await getTopServices(userId)
  };
};