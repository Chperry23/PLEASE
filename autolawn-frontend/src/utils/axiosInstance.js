import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://autolawn.app/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Helper function for friendly error messages
const getFriendlyErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  switch (error.response.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'You need to login to access this feature.';
    case 403:
      return 'You don\'t have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
  const timestamp = new Date().toISOString();
  
  // Ensure URL starts with a slash
  if (!config.url.startsWith('/')) {
    config.url = `/${config.url}`;
  }
  
  // Remove any double slashes in the URL
  config.url = config.url.replace(/\/+/g, '/');

  console.log(`[${timestamp}] Original Request:`, {
    method: config.method,
    url: config.url,
    data: config.data,
    headers: config.headers
  });

  console.log(`[${timestamp}] Final URL:`, `${config.baseURL}${config.url}`);
  
  return config;
}, (error) => {
  console.error('Request error:', {
    message: error.message,
    stack: error.stack
  });
  return Promise.reject({
    ...error,
    friendlyMessage: 'Failed to send request. Please try again.'
  });
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Response:`, {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      timestamp
    };

    // Log specific error types
    if (error.code === 'ECONNABORTED') {
      console.error(`[${timestamp}] Request timeout:`, errorDetails);
    } else if (!error.response) {
      console.error(`[${timestamp}] Network error:`, errorDetails);
    } else if (error.response.status === 404) {
      console.error(`[${timestamp}] API endpoint not found:`, errorDetails);
    } else {
      console.error(`[${timestamp}] Response error:`, errorDetails);
    }

    // Enhance error object
    const enhancedError = {
      ...error,
      timestamp,
      friendlyMessage: getFriendlyErrorMessage(error),
      details: errorDetails
    };

    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;
