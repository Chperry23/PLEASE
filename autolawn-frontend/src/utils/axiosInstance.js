import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://autolawn.app/api', // Ensure HTTPS by default
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token retrieved from localStorage:', token); // Debugging log
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set with token:', config.headers.Authorization); // Debugging log
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error.response ? error.response.data : error.message); // Debugging log
    return Promise.reject(error);
  }
);

export default axiosInstance;
