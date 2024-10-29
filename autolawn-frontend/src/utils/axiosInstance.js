import axios from 'axios';

// Create a function to clean up the URL
const cleanUrl = (url) => {
  // Remove leading/trailing slashes
  const cleaned = url.replace(/^\/+|\/+$/g, '');
  // If the path doesn't start with 'api/', add it
  return cleaned.startsWith('api/') ? cleaned : `api/${cleaned}`;
};

const axiosInstance = axios.create({
  baseURL: 'https://autolawn.app',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor with detailed logging
axiosInstance.interceptors.request.use((config) => {
  // Log incoming request
  console.log('Request Before Processing:', {
    method: config.method,
    originalUrl: config.url,
    baseURL: config.baseURL
  });

  // Clean up the URL
  const cleanedUrl = cleanUrl(config.url);
  config.url = `/${cleanedUrl}`;

  // Log final request details
  console.log('Final Request Configuration:', {
    method: config.method,
    url: config.url,
    fullUrl: `${config.baseURL}${config.url}`
  });

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  console.error('Request Interceptor Error:', error);
  return Promise.reject(error);
});

// Response interceptor with error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response Success:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
