import axios from 'axios';
import debounce from 'lodash/debounce';

export const API_BASE_URL = '/api';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const defaultRoutes = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day] = [
    {
      index: 0,
      jobs: [],
    },
  ];
  return acc;
}, {});

export const validateRoutesStructure = (routes) => {
    return DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = Array.isArray(routes[day]) ? routes[day] : [{ index: 0, jobs: [] }];
      return acc;
    }, {});
  };

  export const fetchWithAuth = async (url, method = 'GET', data = null, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User is not authenticated');
    
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...options,
    };
  
    // Only add `data` if it's not null
    if (data) {
      config.data = data;
    }
  
    try {
      const response = await axios(config);
      return response.data; // Ensure the response is returned as a Promise
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error; // Ensure the error is propagated correctly
    }
  };
  
  
