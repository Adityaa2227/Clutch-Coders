const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  passId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
  amountUsed: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UsageLog', usageLogSchema);
