// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  UsersIcon,
  MapIcon,
  DocumentIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fetchJobs, fetchCustomers, fetchEmployees, fetchAnalytics } from '../api/dashboardApi';

// Removed import for TrialTimer
// import TrialTimer from '../components/TrialTimer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobCount, setJobCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalTimeRange, setGlobalTimeRange] = useState('30');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showInsights, setShowInsights] = useState(true);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  useEffect(() => {
    fetchDashboardData(globalTimeRange, customDateRange);
    const interval = setInterval(() => {
      fetchDashboardData(globalTimeRange, customDateRange);
    }, 600000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, [globalTimeRange, customDateRange]);

  const fetchDashboardData = async (timeRange, customRange = null) => {
    setLoading(true);
    setError(null);
    try {
      const [jobs, customers, employees, analytics] = await Promise.all([
        fetchJobs().catch((error) => {
          console.error('Error fetching jobs:', error);
          return [];
        }),
        fetchCustomers().catch((error) => {
          console.error('Error fetching customers:', error);
          return [];
        }),
        fetchEmployees().catch((error) => {
          console.error('Error fetching employees:', error);
          return [];
        }),
        fetchAnalytics(timeRange, customRange).catch((error) => {
          console.error('Error fetching analytics:', error);
          return {};
        }),
      ]);
      setJobCount(Array.isArray(jobs) ? jobs.length : 0);
      setCustomerCount(Array.isArray(customers) ? customers.length : 0);
      setEmployeeCount(Array.isArray(employees) ? employees.length : 0);
      setAnalyticsData({
        revenue: analytics.revenue || [],
        customerGrowth: analytics.customerGrowth || [],
        jobStatusDistribution: analytics.jobStatusDistribution || [],
        topPerformingEmployees: analytics.topPerformingEmployees || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error.response?.data || error.message);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (e) => {
    const selectedRange = e.target.value;
    setGlobalTimeRange(selectedRange);
    if (selectedRange !== 'custom') {
      setCustomDateRange({ start: '', end: '' });
    }
  };

  const handleCustomDateChange = (e) => {
    setCustomDateRange({ ...customDateRange, [e.target.name]: e.target.value });
  };

  const applyCustomDateRange = () => {
    if (customDateRange.start && customDateRange.end) {
      fetchDashboardData('custom', customDateRange);
    }
  };

  const charts = [
    {
      title: "Revenue Over Time",
      component: (
        <Line
          data={{
            labels: analyticsData?.revenue?.map((item) => item._id) || [],
            datasets: [{
              label: 'Total Revenue ($)',
              data: analyticsData?.revenue?.map((item) => item.totalRevenue) || [],
              fill: true,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: { display: false },
            },
            scales: {
              x: { title: { display: true, text: 'Date' } },
              y: { title: { display: true, text: 'Revenue ($)' }, beginAtZero: true },
            },
          }}
        />
      ),
    },
    {
      title: "Customer Growth",
      component: (
        <Bar
          data={{
            labels: analyticsData?.customerGrowth?.map((item) => item._id) || [],
            datasets: [{
              label: 'New Customers',
              data: analyticsData?.customerGrowth?.map((item) => item.newCustomers) || [],
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
            },
            scales: {
              x: { title: { display: true, text: 'Date' } },
              y: { title: { display: true, text: 'Number of Customers' }, beginAtZero: true },
            },
          }}
        />
      ),
    },
    {
      title: "Job Status Distribution",
      component: (
        <Doughnut
          data={{
            labels: analyticsData?.jobStatusDistribution?.map((item) => item._id) || [],
            datasets: [{
              label: 'Job Status',
              data: analyticsData?.jobStatusDistribution?.map((item) => item.count) || [],
              backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right' },
              title: { display: false },
            },
          }}
        />
      ),
    },
    {
      title: "Top Performing Employees",
      component: (
        <Bar
          data={{
            labels: analyticsData?.topPerformingEmployees?.map((item) => item.name) || [],
            datasets: [{
              label: 'Jobs Completed',
              data: analyticsData?.topPerformingEmployees?.map((item) => item.jobCount) || [],
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
            },
            scales: {
              x: { title: { display: true, text: 'Employee' } },
              y: { title: { display: true, text: 'Jobs Completed' }, beginAtZero: true },
            },
          }}
        />
      ),
    },
  ];

  const nextChart = () => {
    setCurrentChartIndex((prevIndex) => (prevIndex + 1) % charts.length);
  };

  const prevChart = () => {
    setCurrentChartIndex((prevIndex) => (prevIndex - 1 + charts.length) % charts.length);
  };

  const renderChartCarousel = () => {
    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{charts[currentChartIndex].title}</h2>
          <div className="flex space-x-2">
            <button
              onClick={prevChart}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={nextChart}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow" style={{ height: '400px' }}>
          {charts[currentChartIndex].component}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
          <div className="flex items-center">
            <select
              value={globalTimeRange}
              onChange={handleTimeRangeChange}
              className="mr-2 p-2 border rounded text-black"
            >
              <option value="7">Past 7 days</option>
              <option value="30">Past 30 days</option>
              <option value="90">Past 90 days</option>
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
            {globalTimeRange === 'custom' && (
              <>
                <input
                  type="date"
                  name="start"
                  value={customDateRange.start}
                  onChange={handleCustomDateChange}
                  className="mr-2 p-2 border rounded"
                />
                <input
                  type="date"
                  name="end"
                  value={customDateRange.end}
                  onChange={handleCustomDateChange}
                  className="mr-2 p-2 border rounded"
                />
                <button
                  onClick={applyCustomDateRange}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
                >
                  Apply
                </button>
              </>
            )}
            <button
              onClick={() => fetchDashboardData(globalTimeRange, globalTimeRange === 'custom' ? customDateRange : null)}
              className="ml-4 bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <OverviewCard title="Jobs" count={jobCount} link="/manage-jobs" />
          <OverviewCard title="Customers" count={customerCount} link="/manage-customers" />
          <OverviewCard title="Employees" count={employeeCount} link="/manage-employees" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <QuickActionButton to="/jobs" icon={PlusIcon} text="Create New Job" />
            <QuickActionButton to="/customers" icon={PlusIcon} text="Add New Customer" />
            <QuickActionButton to="/add-employee" icon={UsersIcon} text="Add New Employee" />
            <QuickActionButton to="/generate-report" icon={DocumentIcon} text="Generate Report" />
            <QuickActionButton to="/build-routes" icon={MapIcon} text="Build Routes" />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Dashboard Insights</h2>
          <button onClick={() => setShowInsights(!showInsights)} className="text-white hover:text-gray-400">
            {showInsights ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
          </button>
        </div>

        {showInsights && (
          <>
            {loading ? (
              <div className="text-center py-12">Loading dashboard data...</div>
            ) : (
              renderChartCarousel()
            )}
          </>
        )}
      </main>
    </div>
  );
};

const OverviewCard = ({ title, count, link }) => (
  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg leading-6 font-medium text-white">{title}</h3>
      <div className="mt-2 text-3xl font-semibold text-white">{count}</div>
      <div className="mt-4">
        <Link to={link} className="text-blue-400 hover:text-blue-300">
          View all {title.toLowerCase()}
        </Link>
      </div>
    </div>
  </div>
);

const QuickActionButton = ({ to, icon: Icon, text }) => (
  <Link
    to={to}
    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center justify-center"
  >
    <Icon className="h-5 w-5 mr-2" />
    {text}
  </Link>
);

export default Dashboard;