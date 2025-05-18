require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  // Add other configuration variables as needed
};