const express = require('express');
const router = express.Router();
const VitalSign = require('../models/VitalSign');
const { authMiddleware } = require('../utils/auth.js');
const Joi = require('joi');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schema for vital signs
const vitalSignSchema = Joi.object({
  patientId: Joi.string().required(),
  heartRate: Joi.object({
    value: Joi.number().required(),
    unit: Joi.string()
  }).required(),
  bloodPressure: Joi.object({
    systolic: Joi.number().required(),
    diastolic: Joi.number().required(),
    unit: Joi.string()
  }).required(),
  temperature: Joi.object({
    value: Joi.number().required(),
    unit: Joi.string().valid('celsius', 'fahrenheit')
  }).required(),
  oxygenSaturation: Joi.object({
    value: Joi.number().min(0).max(100).required(),
    unit: Joi.string()
  }).required(),
  respiratoryRate: Joi.object({
    value: Joi.number().required(),
    unit: Joi.string()
  }).required(),
  bloodGlucose: Joi.object({
    value: Joi.number(),
    unit: Joi.string()
  }),
  painLevel: Joi.number().min(0).max(10),
  weight: Joi.object({
    value: Joi.number(),
    unit: Joi.string().valid('kg', 'lbs')
  }),
  notes: Joi.string(),
  deviceId: Joi.string()
});

// Get vital signs for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    
    const query = { patientId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const vitals = await VitalSign.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await VitalSign.countDocuments(query);
    
    res.json({
      vitals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    res.status(500).json({ error: 'Failed to fetch vital signs' });
  }
});

// Get latest vital signs for a patient
router.get('/patient/:patientId/latest', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const latestVital = await VitalSign.findOne({ patientId })
      .sort({ createdAt: -1 });
    
    if (!latestVital) {
      return res.status(404).json({ error: 'No vital signs found for this patient' });
    }
    
    res.json(latestVital);
  } catch (error) {
    console.error('Error fetching latest vital signs:', error);
    res.status(500).json({ error: 'Failed to fetch latest vital signs' });
  }
});

// Get vital sign by ID
router.get('/:id', async (req, res) => {
  try {
    const vitalSign = await VitalSign.findById(req.params.id);
    
    if (!vitalSign) {
      return res.status(404).json({ error: 'Vital sign record not found' });
    }
    
    res.json(vitalSign);
  } catch (error) {
    console.error('Error fetching vital sign:', error);
    res.status(500).json({ error: 'Failed to fetch vital sign' });
  }
});

// Record new vital signs
router.post('/', async (req, res) => {
  try {
    const { error } = vitalSignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const vitalSign = new VitalSign({
      ...req.body,
      recordedBy: {
        userId: req.user.id,
        name: req.user.username,
        role: req.user.role
      }
    });
    
    // Check for critical values
    const alerts = vitalSign.checkCriticalValues();
    
    await vitalSign.save();
    
    // Publish to RabbitMQ
    const rabbitmq = req.app.locals.rabbitmq;
    if (rabbitmq) {
      await rabbitmq.publishToQueue('vital-signs-events', {
        event: 'vitals.recorded',
        patientId: vitalSign.patientId,
        vitalSignId: vitalSign._id,
        data: vitalSign,
        alerts: alerts,
        timestamp: new Date()
      });
      
      // If there are critical alerts, publish to alert queue
      if (alerts.some(alert => alert.type === 'critical')) {
        await rabbitmq.publishToQueue('alert-events', {
          event: 'alert.critical',
          patientId: vitalSign.patientId,
          vitalSignId: vitalSign._id,
          alerts: alerts.filter(alert => alert.type === 'critical'),
          timestamp: new Date()
        });
      }
    }
    
    res.status(201).json({
      message: 'Vital signs recorded successfully',
      vitalSign,
      alerts
    });
  } catch (error) {
    console.error('Error recording vital signs:', error);
    res.status(500).json({ error: 'Failed to record vital signs' });
  }
});

// Bulk record vital signs (for device integration)
router.post('/bulk', async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Invalid records array' });
    }
    
    const results = [];
    const errors = [];
    
    for (const record of records) {
      try {
        const { error } = vitalSignSchema.validate(record);
        if (error) {
          errors.push({
            record,
            error: error.details[0].message
          });
          continue;
        }
        
        const vitalSign = new VitalSign({
          ...record,
          isAutoRecorded: true,
          recordedBy: {
            userId: req.user.id,
            name: 'System',
            role: 'device'
          }
        });
        
        const alerts = vitalSign.checkCriticalValues();
        await vitalSign.save();
        
        results.push({
          vitalSign,
          alerts
        });
        
        // Publish events
        const rabbitmq = req.app.locals.rabbitmq;
        if (rabbitmq && alerts.some(alert => alert.type === 'critical')) {
          await rabbitmq.publishToQueue('alert-events', {
            event: 'alert.critical',
            patientId: vitalSign.patientId,
            vitalSignId: vitalSign._id,
            alerts: alerts.filter(alert => alert.type === 'critical'),
            timestamp: new Date()
          });
        }
      } catch (err) {
        errors.push({
          record,
          error: err.message
        });
      }
    }
    
    res.json({
      message: 'Bulk vital signs processing complete',
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error in bulk recording:', error);
    res.status(500).json({ error: 'Failed to process bulk records' });
  }
});

// Get vital sign trends
router.get('/patient/:patientId/trends', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { parameter, days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const vitals = await VitalSign.find({
      patientId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });
    
    // Process trends based on parameter
    const trends = {
      timestamps: vitals.map(v => v.createdAt),
      heartRate: vitals.map(v => v.heartRate.value),
      bloodPressureSystolic: vitals.map(v => v.bloodPressure.systolic),
      bloodPressureDiastolic: vitals.map(v => v.bloodPressure.diastolic),
      temperature: vitals.map(v => v.temperature.value),
      oxygenSaturation: vitals.map(v => v.oxygenSaturation.value),
      respiratoryRate: vitals.map(v => v.respiratoryRate.value)
    };
    
    if (parameter && trends[parameter]) {
      res.json({
        parameter,
        timestamps: trends.timestamps,
        values: trends[parameter]
      });
    } else {
      res.json(trends);
    }
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

module.exports = router;