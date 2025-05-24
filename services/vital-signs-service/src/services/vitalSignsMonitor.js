const VitalSign = require('../models/VitalSign');

class VitalSignsMonitor {
  constructor(rabbitmq) {
    this.rabbitmq = rabbitmq;
  }

  async checkAllPatientVitals() {
    try {
      // Get distinct patient IDs from the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const patientIds = await VitalSign.distinct('patientId', {
        createdAt: { $gte: oneDayAgo }
      });
      
      for (const patientId of patientIds) {
        await this.checkPatientVitals(patientId);
      }
    } catch (error) {
      console.error('Error in vital signs monitoring:', error);
    }
  }

  async checkPatientVitals(patientId) {
    try {
      // Get latest vital signs
      const latestVital = await VitalSign.findOne({ patientId })
        .sort({ createdAt: -1 });
      
      if (!latestVital) return;
      
      // Check if vital signs are stale (no update in last 2 hours)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      if (latestVital.createdAt < twoHoursAgo) {
        await this.rabbitmq.publishToQueue('alert-events', {
          event: 'alert.warning',
          patientId: patientId,
          type: 'stale_vitals',
          message: 'No vital signs recorded in the last 2 hours',
          timestamp: new Date()
        });
      }
      
      // Check for sustained abnormal values
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentVitals = await VitalSign.find({
        patientId,
        createdAt: { $gte: oneHourAgo }
      }).sort({ createdAt: -1 });
      
      if (recentVitals.length >= 3) {
        this.checkSustainedAbnormalValues(patientId, recentVitals);
      }
    } catch (error) {
      console.error(`Error checking vitals for patient ${patientId}:`, error);
    }
  }

  checkSustainedAbnormalValues(patientId, vitals) {
    const parameters = ['heartRate', 'oxygenSaturation', 'respiratoryRate'];
    
    for (const param of parameters) {
      let allAbnormal = true;
      
      for (const vital of vitals) {
        const alerts = vital.checkCriticalValues();
        if (!alerts.some(alert => alert.parameter === param)) {
          allAbnormal = false;
          break;
        }
      }
      
      if (allAbnormal) {
        this.rabbitmq.publishToQueue('alert-events', {
          event: 'alert.critical',
          patientId: patientId,
          type: 'sustained_abnormal',
          parameter: param,
          message: `Sustained abnormal ${param} for the last hour`,
          timestamp: new Date()
        });
      }
    }
  }
}

module.exports = VitalSignsMonitor;