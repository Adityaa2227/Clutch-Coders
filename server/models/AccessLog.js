const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be null if unknown user
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  status: { type: String, enum: ['success', 'failed'], required: true },
  ip: { type: String },
  failureReason: { type: String }, // e.g., "Invalid Token", "Expired Pass"
  timestamp: { type: Date, default: Date.now },
});

// Index for fast sorting by time
accessLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
