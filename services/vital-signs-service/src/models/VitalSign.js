const mongoose = require('mongoose');

const vitalSignSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  heartRate: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'bpm'
    }
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: true
    },
    diastolic: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'mmHg'
    }
  },
  temperature: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    }
  },
  oxygenSaturation: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: '%'
    }
  },
  respiratoryRate: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'breaths/min'
    }
  },
  bloodGlucose: {
    value: Number,
    unit: {
      type: String,
      default: 'mg/dL'
    }
  },
  painLevel: {
    type: Number,
    min: 0,
    max: 10
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  recordedBy: {
    userId: String,
    name: String,
    role: String
  },
  notes: String,
  isAutoRecorded: {
    type: Boolean,
    default: false
  },
  deviceId: String,
  alertsTriggered: [{
    type: {
      type: String,
      enum: ['critical', 'warning', 'info']
    },
    parameter: String,
    message: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
vitalSignSchema.index({ patientId: 1, createdAt: -1 });
vitalSignSchema.index({ createdAt: -1 });

// Method to check if vital signs are critical
vitalSignSchema.methods.checkCriticalValues = function() {
  const alerts = [];
  
  // Heart rate checks
  if (this.heartRate.value < 40 || this.heartRate.value > 130) {
    alerts.push({
      type: 'critical',
      parameter: 'heartRate',
      message: `Critical heart rate: ${this.heartRate.value} bpm`,
      timestamp: new Date()
    });
  } else if (this.heartRate.value < 50 || this.heartRate.value > 100) {
    alerts.push({
      type: 'warning',
      parameter: 'heartRate',
      message: `Abnormal heart rate: ${this.heartRate.value} bpm`,
      timestamp: new Date()
    });
  }
  
  // Blood pressure checks
  if (this.bloodPressure.systolic > 180 || this.bloodPressure.diastolic > 120) {
    alerts.push({
      type: 'critical',
      parameter: 'bloodPressure',
      message: `Hypertensive crisis: ${this.bloodPressure.systolic}/${this.bloodPressure.diastolic} mmHg`,
      timestamp: new Date()
    });
  } else if (this.bloodPressure.systolic < 90 || this.bloodPressure.diastolic < 60) {
    alerts.push({
      type: 'warning',
      parameter: 'bloodPressure',
      message: `Low blood pressure: ${this.bloodPressure.systolic}/${this.bloodPressure.diastolic} mmHg`,
      timestamp: new Date()
    });
  }
  
  // Temperature checks (assuming Celsius)
  if (this.temperature.unit === 'celsius') {
    if (this.temperature.value > 39.5 || this.temperature.value < 35) {
      alerts.push({
        type: 'critical',
        parameter: 'temperature',
        message: `Critical temperature: ${this.temperature.value}°C`,
        timestamp: new Date()
      });
    } else if (this.temperature.value > 38 || this.temperature.value < 36) {
      alerts.push({
        type: 'warning',
        parameter: 'temperature',
        message: `Abnormal temperature: ${this.temperature.value}°C`,
        timestamp: new Date()
      });
    }
  }
  
  // Oxygen saturation checks
  if (this.oxygenSaturation.value < 90) {
    alerts.push({
      type: 'critical',
      parameter: 'oxygenSaturation',
      message: `Critical oxygen saturation: ${this.oxygenSaturation.value}%`,
      timestamp: new Date()
    });
  } else if (this.oxygenSaturation.value < 95) {
    alerts.push({
      type: 'warning',
      parameter: 'oxygenSaturation',
      message: `Low oxygen saturation: ${this.oxygenSaturation.value}%`,
      timestamp: new Date()
    });
  }
  
  // Respiratory rate checks
  if (this.respiratoryRate.value < 8 || this.respiratoryRate.value > 30) {
    alerts.push({
      type: 'critical',
      parameter: 'respiratoryRate',
      message: `Critical respiratory rate: ${this.respiratoryRate.value} breaths/min`,
      timestamp: new Date()
    });
  } else if (this.respiratoryRate.value < 12 || this.respiratoryRate.value > 20) {
    alerts.push({
      type: 'warning',
      parameter: 'respiratoryRate',
      message: `Abnormal respiratory rate: ${this.respiratoryRate.value} breaths/min`,
      timestamp: new Date()
    });
  }
  
  // Blood glucose checks (if available)
  if (this.bloodGlucose && this.bloodGlucose.value) {
    if (this.bloodGlucose.value < 70 || this.bloodGlucose.value > 400) {
      alerts.push({
        type: 'critical',
        parameter: 'bloodGlucose',
        message: `Critical blood glucose: ${this.bloodGlucose.value} mg/dL`,
        timestamp: new Date()
      });
    } else if (this.bloodGlucose.value < 80 || this.bloodGlucose.value > 180) {
      alerts.push({
        type: 'warning',
        parameter: 'bloodGlucose',
        message: `Abnormal blood glucose: ${this.bloodGlucose.value} mg/dL`,
        timestamp: new Date()
      });
    }
  }
  
  this.alertsTriggered = alerts;
  return alerts;
};

module.exports = mongoose.model('VitalSign', vitalSignSchema);