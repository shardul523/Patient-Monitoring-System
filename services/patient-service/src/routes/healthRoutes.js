const express = require('express');
const db = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    
    return res.status(200).json({
      success: true,
      message: 'Patient service is healthy',
      timestamp: new Date().toISOString(),
      service: 'patient-service',
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    
    return res.status(503).json({
      success: false,
      message: 'Patient service is unhealthy',
      timestamp: new Date().toISOString(),
      service: 'patient-service',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;