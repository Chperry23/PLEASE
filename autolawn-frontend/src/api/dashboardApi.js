// frontend/src/api/dashboardApi.js

import axios from 'axios';

// Base URL for API requests
const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// Function to retrieve headers with the Authorization token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// Fetch jobs
export const fetchJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/jobs`, getHeaders());
    return response.data.jobs; // Adjust based on backend response
  } catch (error) {
    console.error('Error fetching jobs:', error.response?.data || error.message);
    throw error;
  }
};

// Fetch customers
export const fetchCustomers = async () => {
  try {
    const response = await axios.get(`${API_URL}/customers`, getHeaders());
    return response.data.customers; // Adjust based on backend response
  } catch (error) {
    console.error('Error fetching customers:', error.response?.data || error.message);
    throw error;
  }
};

// Fetch employees
export const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${API_URL}/employees`, getHeaders());
    return response.data.employees; // Adjust based on backend response
  } catch (error) {
    console.error('Error fetching employees:', error.response?.data || error.message);
    throw error;
  }
};

// Fetch analytics data based on time range
export const fetchAnalytics = async (timeRange, customRange = null) => {
  try {
    let params = {};

    if (timeRange === 'custom') {
      if (customRange && customRange.start && customRange.end) {
        params = { timeRange: 'custom', startDate: customRange.start, endDate: customRange.end };
      } else {
        throw new Error('Custom range requires startDate and endDate');
      }
    } else {
      // Assume timeRange is a number representing days
      params = { timeRange };
    }

    const response = await axios.get(`${API_URL}/analytics`, {
      ...getHeaders(),
      params,
    });

    return response.data.data; // Adjust based on backend response
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Analytics endpoint not found:', error.response.data);
      throw new Error('Analytics data not found. Please contact support.');
    } else if (error.message === 'Custom range requires startDate and endDate') {
      throw error;
    } else {
      console.error('Error fetching analytics:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Fetch counts of customers, jobs, and employees
export const fetchAnalyticsCounts = async () => {
  try {
    const response = await axios.get(`${API_URL}/analytics/counts`, getHeaders());
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('Failed to fetch analytics counts');
    }
  } catch (error) {
    console.error('Error fetching analytics counts:', error.response?.data || error.message);
    throw error;
  }
};
