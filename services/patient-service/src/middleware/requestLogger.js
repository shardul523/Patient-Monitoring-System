const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

module.exports = { requestLogger };