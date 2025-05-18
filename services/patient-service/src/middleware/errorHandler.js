const logger = require('../config/logger');
const { 
  ValidationError, 
  NotFoundError, 
  DatabaseError 
} = require('../utils/errorTypes');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
};

module.exports = { errorHandler };