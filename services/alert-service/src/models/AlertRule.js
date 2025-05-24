const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  category: {
    type: String,
    enum: ['vital_signs', 'medication', 'appointment', 'system'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  conditions: [{
    parameter: String,
    operator: {
      type: String,
      enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between', 'contains']
    },
    value: mongoose.Schema.Types.Mixed,
    value2: mongoose.Schema.Types.Mixed // For 'between' operator
  }],
  actions: [{
    type: {
      type: String,
      enum: ['notify', 'escalate', 'log', 'webhook']
    },
    target: mongoose.Schema.Types.Mixed,
    template: String,
    delay: Number // Delay in minutes
  }],
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    default: 'warning'
  },
  cooldownPeriod: {
    type: Number,
    default: 60 // Minutes before the same alert can be triggered again
  },
  applicablePatients: {
    type: String,
    enum: ['all', 'specific', 'condition-based'],
    default: 'all'
  },
  patientIds: [String],
  patientConditions: mongoose.Schema.Types.Mixed,
  createdBy: {
    userId: String,
    name: String
  },
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

alertRuleSchema.methods.evaluateConditions = function(data) {
  return this.conditions.every(condition => {
    const value = data[condition.parameter];
    
    switch (condition.operator) {
      case 'gt':
        return value > condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lt':
        return value < condition.value;
      case 'lte':
        return value <= condition.value;
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'between':
        return value >= condition.value && value <= condition.value2;
      case 'contains':
        return String(value).includes(condition.value);
      default:
        return false;
    }
  });
};

module.exports = mongoose.model('AlertRule', alertRuleSchema);