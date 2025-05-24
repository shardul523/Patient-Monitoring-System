// Add these routes to the existing alertRoutes.js file
const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const AlertRule = require('../models/AlertRule');
const { authMiddleware } = require('../utils/auth');
const Joi = require('joi');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      patientId, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (patientId) query.patientId = patientId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const alerts = await Alert.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Alert.countDocuments(query);
    
    res.json({
      alerts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Get alerts for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, limit = 10 } = req.query;
    
    const query = { patientId };
    if (status) query.status = status;
    
    const alerts = await Alert.find(query)
      .limit(limit * 1)
      .sort({ createdAt: -1 });
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching patient alerts:', error);
    res.status(500).json({ error: 'Failed to fetch patient alerts' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    if (alert.status !== 'active') {
      return res.status(400).json({ error: 'Alert is not active' });
    }
    
    await alert.acknowledge(req.user.id, req.user.username);
    
    // Emit socket event
    const io = req.app.locals.io;
    io.to(`patient-${alert.patientId}`).emit('alert-acknowledged', {
      alertId: alert._id,
      acknowledgedBy: req.user.username
    });
    
    res.json({
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.post('/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body;
    
    if (!resolution) {
      return res.status(400).json({ error: 'Resolution is required' });
    }
    
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    if (alert.status === 'resolved') {
      return res.status(400).json({ error: 'Alert is already resolved' });
    }
    
    await alert.resolve(req.user.id, req.user.username, resolution);
    
    // Emit socket event
    const io = req.app.locals.io;
    io.to(`patient-${alert.patientId}`).emit('alert-resolved', {
      alertId: alert._id,
      resolvedBy: req.user.username
    });
    
    res.json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Escalate alert
router.post('/:id/escalate', async (req, res) => {
  try {
    const { toUserId, toUserName, reason } = req.body;
    
    if (!toUserId || !reason) {
      return res.status(400).json({ error: 'Target user and reason are required' });
    }
    
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    await alert.escalate(
      toUserId, 
      toUserName, 
      req.user.id, 
      req.user.username, 
      reason
    );
    
    // Send notification to escalated user
    const notificationService = req.app.locals.alertProcessor.notificationService;
    await notificationService.sendInAppNotification(toUserId, {
      title: 'Alert Escalated',
      message: `Alert for patient ${alert.patientId} has been escalated to you`,
      alertId: alert._id
    });
    
    res.json({
      message: 'Alert escalated successfully',
      alert
    });
  } catch (error) {
    console.error('Error escalating alert:', error);
    res.status(500).json({ error: 'Failed to escalate alert' });
  }
});

// Get alert statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    
    const stats = await Alert.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.status',
          types: {
            $push: {
              type: '$_id.type',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);
    
    const avgResponseTime = await Alert.aggregate([
      {
        $match: {
          ...dateQuery,
          status: { $in: ['acknowledged', 'resolved'] },
          'acknowledgedBy.acknowledgedAt': { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: ['$acknowledgedBy.acknowledgedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    res.json({
      statusBreakdown: stats,
      averageResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Alert Rules Routes

// Get all alert rules
router.get('/rules/all', async (req, res) => {
  try {
    const rules = await AlertRule.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    res.json(rules);
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

// Create alert rule
router.post('/rules', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized to create alert rules' });
    }
    
    const rule = new AlertRule({
      ...req.body,
      createdBy: {
        userId: req.user.id,
        name: req.user.username
      }
    });
    
    await rule.save();
    
    res.status(201).json({
      message: 'Alert rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

// Update alert rule
router.put('/rules/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized to update alert rules' });
    }
    
    const rule = await AlertRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    res.json({
      message: 'Alert rule updated successfully',
      rule
    });
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

// Delete (deactivate) alert rule
router.delete('/rules/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete alert rules' });
    }
    
    const rule = await AlertRule.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    res.json({
      message: 'Alert rule deactivated successfully',
      rule
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});


// Get notifications for current user
router.get('/notifications', async (req, res) => {
  try {
    const notificationService = req.app.locals.alertProcessor.notificationService;
    const notifications = await notificationService.getNotifications(
      req.user.id,
      req.query
    );
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const notificationService = req.app.locals.alertProcessor.notificationService;
    const count = await notificationService.getUnreadCount(req.user.id);
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationService = req.app.locals.alertProcessor.notificationService;
    const result = await notificationService.markAsRead(
      req.user.id,
      req.params.id
    );
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const notificationService = req.app.locals.alertProcessor.notificationService;
    const result = await notificationService.markAllAsRead(req.user.id);
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.count 
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

module.exports = router;