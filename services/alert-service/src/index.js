const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const alertRoutes = require('./routes/alertRoutes');
const RabbitMQ = require('./utils/rabbitmq');
const AlertProcessor = require('./services/alertProcessor');
const NotificationService = require('./services/notificationService');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 8083;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const rabbitmq = new RabbitMQ();
const notificationService = new NotificationService();
const alertProcessor = new AlertProcessor(notificationService, io);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alerts', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Connect to RabbitMQ and start consuming
rabbitmq.connect().then(async () => {
  app.locals.rabbitmq = rabbitmq;
  app.locals.alertProcessor = alertProcessor;
  app.locals.io = io;
  
  // Consume alert events
  await rabbitmq.consumeFromQueue('alert-events', async (message) => {
    await alertProcessor.processAlert(message);
  });
  
  // Consume vital signs events
  await rabbitmq.consumeFromQueue('vital-signs-events', async (message) => {
    if (message.alerts && message.alerts.length > 0) {
      await alertProcessor.processVitalSignAlerts(message);
    }
  });
  
}).catch(err => {
  console.error('RabbitMQ connection error:', err);
});

// Socket.IO connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (data) => {
    if (data.patientId) {
      socket.join(`patient-${data.patientId}`);
    }
    if (data.userId) {
      socket.join(`user-${data.userId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'alert-service',
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, () => {
  console.log(`Alert Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  await rabbitmq.close();
  httpServer.close();
  process.exit(0);
});