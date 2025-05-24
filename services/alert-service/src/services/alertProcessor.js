const Alert = require('../models/Alert');
const AlertRule = require('../models/AlertRule');

class AlertProcessor {
  constructor(notificationService, io) {
    this.notificationService = notificationService;
    this.io = io;
  }

  async processAlert(message) {
    try {
      console.log('Processing alert:', message);
      
      // Create alert based on event type
      let alert;
      
      switch (message.event) {
        case 'alert.critical':
          alert = await this.createCriticalAlert(message);
          break;
        case 'alert.warning':
          alert = await this.createWarningAlert(message);
          break;
        default:
          alert = await this.createGeneralAlert(message);
      }
      
      // Send notifications
      await this.sendNotifications(alert);
      
      // Emit real-time update
      this.io.to(`patient-${alert.patientId}`).emit('new-alert', alert);
      
    } catch (error) {
      console.error('Error processing alert:', error);
    }
  }

  async createCriticalAlert(data) {
    const alert = new Alert({
      patientId: data.patientId,
      type: 'critical',
      category: 'vital_signs',
      source: {
        service: 'vital-signs-service',
        eventId: data.vitalSignId
      },
      title: 'Critical Vital Signs Alert',
      message: this.formatAlertMessage(data.alerts),
      details: data.alerts,
      priority: 5,
      tags: ['urgent', 'vital-signs']
    });
    
    await alert.save();
    return alert;
  }

  async createWarningAlert(data) {
    const alert = new Alert({
      patientId: data.patientId,
      type: 'warning',
      category: data.category || 'system',
      title: data.title || 'Warning Alert',
      message: data.message,
      details: data.details,
      priority: 3,
      tags: data.tags || []
    });
    
    await alert.save();
    return alert;
  }

  async createGeneralAlert(data) {
    const alert = new Alert({
      patientId: data.patientId,
      type: data.type || 'info',
      category: data.category || 'system',
      title: data.title || 'System Alert',
      message: data.message,
      details: data.details,
      priority: data.priority || 2,
      tags: data.tags || []
    });
    
    await alert.save();
    return alert;
  }

  formatAlertMessage(alerts) {
    if (!alerts || alerts.length === 0) return 'Alert triggered';
    
    const messages = alerts.map(a => a.message);
    return messages.join('; ');
  }

  async processVitalSignAlerts(data) {
    try {
      // Check against alert rules
      const rules = await AlertRule.find({ 
        isActive: true, 
        category: 'vital_signs' 
      });
      
      for (const rule of rules) {
        if (this.shouldTriggerRule(rule, data)) {
          await this.triggerAlertRule(rule, data);
        }
      }
      
      // Process any immediate alerts
      if (data.alerts && data.alerts.length > 0) {
        await this.processAlert(data);
      }
    } catch (error) {
      console.error('Error processing vital sign alerts:', error);
    }
  }

  shouldTriggerRule(rule, data) {
    // Check cooldown period
    if (rule.lastTriggered) {
      const cooldownEnd = new Date(rule.lastTriggered);
      cooldownEnd.setMinutes(cooldownEnd.getMinutes() + rule.cooldownPeriod);
      if (new Date() < cooldownEnd) {
        return false;
      }
    }
    
    // Check if rule applies to this patient
    if (rule.applicablePatients === 'specific' && 
        !rule.patientIds.includes(data.patientId)) {
      return false;
    }
    
    // Evaluate conditions
    return rule.evaluateConditions(data.data);
  }

  async triggerAlertRule(rule, data) {
    try {
      // Create alert
      const alert = new Alert({
        patientId: data.patientId,
        type: rule.severity,
        category: rule.category,
        title: rule.name,
        message: `Alert rule triggered: ${rule.description}`,
        details: {
          ruleId: rule._id,
          triggerData: data.data,
          conditions: rule.conditions
        },
        priority: this.getPriorityFromSeverity(rule.severity),
        tags: ['rule-triggered', rule.category]
      });
      
      await alert.save();
      
      // Update rule
      rule.lastTriggered = new Date();
      rule.triggerCount += 1;
      await rule.save();
      
      // Execute actions
      for (const action of rule.actions) {
        await this.executeRuleAction(action, alert, data);
      }
      
      // Emit real-time update
      this.io.to(`patient-${alert.patientId}`).emit('rule-alert', {
        alert,
        rule: rule.name
      });
      
    } catch (error) {
      console.error('Error triggering alert rule:', error);
    }
  }

  async executeRuleAction(action, alert, data) {
    switch (action.type) {
      case 'notify':
        await this.sendNotifications(alert, action.target);
        break;
      case 'escalate':
        await alert.escalate(
          action.target.userId,
          action.target.userName,
          'system',
          'Alert Rule',
          'Automatic escalation by rule'
        );
        break;
      case 'webhook':
        // Implement webhook call if needed
        break;
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  getPriorityFromSeverity(severity) {
    const map = {
      'critical': 5,
      'warning': 3,
      'info': 1
    };
    return map[severity] || 2;
  }

  async sendNotifications(alert, targets) {
    try {
      // Determine notification targets
      const notificationTargets = targets || await this.getNotificationTargets(alert);
      
      // Send in-app notifications to all targets
      for (const target of notificationTargets) {
        await this.notificationService.sendInAppNotification(target.userId, {
          title: alert.title,
          message: alert.message,
          alertId: alert._id,
          priority: alert.priority >= 4 ? 'high' : 'normal'
        });
        
        // Emit socket event for real-time notification
        this.io.to(`user-${target.userId}`).emit('notification', {
          type: 'alert',
          title: alert.title,
          message: alert.message,
          alertId: alert._id,
          priority: alert.priority,
          timestamp: new Date()
        });
      }
      
      // Update alert with notification status
      alert.notifications.push({
        type: 'in-app',
        sentTo: notificationTargets.map(t => t.userId).join(','),
        sentAt: new Date(),
        status: 'sent'
      });
      
      await alert.save();
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  async getNotificationTargets(alert) {
    // In a real system, this would query user preferences and assignments
    // For now, return mock data based on alert priority
    const targets = [];
    
    // Always notify assigned medical staff
    if (alert.assignedTo && alert.assignedTo.length > 0) {
      targets.push(...alert.assignedTo.map(a => ({
        userId: a.userId,
        name: a.name
      })));
    }
    
    // For critical alerts, notify all active medical staff
    if (alert.priority >= 4) {
      // This would query the database for all active staff
      targets.push(
        { userId: 'doctor1', name: 'Dr. Smith' },
        { userId: 'nurse1', name: 'Nurse Johnson' }
      );
    }
    
    // Remove duplicates
    const uniqueTargets = targets.filter((target, index, self) =>
      index === self.findIndex(t => t.userId === target.userId)
    );
    
    return uniqueTargets;
  }
}

module.exports = AlertProcessor;