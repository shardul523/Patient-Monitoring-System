const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
require('dotenv').config();

const vitalSignsRoutes = require('./routes/vitalSignsRoutes');
const RabbitMQ = require('./utils/rabbitmq');
const VitalSignsMonitor = require('./services/vitalSignsMonitor');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize RabbitMQ
const rabbitmq = new RabbitMQ();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitals', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Connect to RabbitMQ
rabbitmq.connect().then(() => {
  app.locals.rabbitmq = rabbitmq;
  
  // Initialize vital signs monitor
  const monitor = new VitalSignsMonitor(rabbitmq);
  app.locals.monitor = monitor;
  
  // Start monitoring cron job (every minute)
  cron.schedule('* * * * *', async () => {
    await monitor.checkAllPatientVitals();
  });
  
}).catch(err => {
  console.error('RabbitMQ connection error:', err);
});

// Routes
app.use('/api/vitals', vitalSignsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'vital-signs-service',
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Vital Signs Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  await rabbitmq.close();
  process.exit(0);
});