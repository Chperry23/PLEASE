import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://autolawn.app/api',  // Changed this line
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Added this line for cookies
});

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
  console.log('Original Request:', {
    method: config.method,
    url: config.url,
    data: config.data
  });

  // Ensure URL starts with a slash
  if (!config.url.startsWith('/')) {
    config.url = `/${config.url}`;
  }

  // Remove the API prefix addition since it's now in baseURL
  console.log('Modified Request:', {
    method: config.method,
    url: config.url,
    fullUrl: `${config.baseURL}${config.url}`
  });

  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
