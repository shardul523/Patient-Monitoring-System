const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Service URLs
const services = {
  patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:8081',
  vital: process.env.VITAL_SERVICE_URL || 'http://localhost:8082',
  alert: process.env.ALERT_SERVICE_URL || 'http://localhost:8083'
};

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  timeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Service temporarily unavailable' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Patient service routes
app.use('/api/patients', createProxyMiddleware({
  target: services.patient,
  ...proxyOptions
}));

// Vital signs service routes
app.use('/api/vitals', createProxyMiddleware({
  target: services.vital,
  ...proxyOptions
}));

// Alert service routes
app.use('/api/alerts', createProxyMiddleware({
  target: services.alert,
  ...proxyOptions
}));


console.log('Sending to Auth');

// Authentication endpoint (handled by patient service)
app.use('/api/auth', createProxyMiddleware({
  target: services.patient,
  ...proxyOptions
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service endpoints:', services);
});