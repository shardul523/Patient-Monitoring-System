const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const routes = require('./routes');
const logger = require('./config/logger');
const db = require('./models');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

// Handle unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Database synchronization and server start
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Only sync in development, use migrations in production
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync();
      logger.info('Database synchronized');
    }
    
    app.listen(PORT, () => {
      logger.info(`Patient service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unexpected errors
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = app;