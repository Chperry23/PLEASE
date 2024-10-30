const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log('Request:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer [FILTERED]' : undefined
    }
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log('Response:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

module.exports = requestLogger;

