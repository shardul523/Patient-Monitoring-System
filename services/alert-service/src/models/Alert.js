const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['vital_signs', 'medication', 'appointment', 'system', 'custom'],
    required: true
  },
  source: {
    service: String,
    eventId: String
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'escalated'],
    default: 'active',
    index: true
  },
  assignedTo: [{
    userId: String,
    name: String,
    role: String,
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  acknowledgedBy: {
    userId: String,
    name: String,
    acknowledgedAt: Date
  },
  resolvedBy: {
    userId: String,
    name: String,
    resolvedAt: Date,
    resolution: String
  },
  escalatedTo: {
    userId: String,
    name: String,
    escalatedAt: Date,
    reason: String
  },
  notifications: [{
    type: {
      type: String,
      enum: ['in-app', 'push']
    },
    sentTo: String,
    sentAt: Date,
    status: String,
    error: String
  }],
  relatedAlerts: [String],
  tags: [String],
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ patientId: 1, status: 1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
alertSchema.methods.acknowledge = function(userId, userName) {
  this.status = 'acknowledged';
  this.acknowledgedBy = {
    userId,
    name: userName,
    acknowledgedAt: new Date()
  };
  return this.save();
};

alertSchema.methods.resolve = function(userId, userName, resolution) {
  this.status = 'resolved';
  this.resolvedBy = {
    userId,
    name: userName,
    resolvedAt: new Date(),
    resolution
  };
  return this.save();
};

alertSchema.methods.escalate = function(toUserId, toUserName, byUserId, byUserName, reason) {
  this.status = 'escalated';
  this.escalatedTo = {
    userId: toUserId,
    name: toUserName,
    escalatedAt: new Date(),
    reason
  };
  this.assignedTo.push({
    userId: toUserId,
    name: toUserName,
    role: 'escalated'
  });
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);