const logger = {
  info: (message, data = '') => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  
  warn: (message, data = '') => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  
  debug: (message, data = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};

module.exports = logger;