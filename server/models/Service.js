const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['time', 'usage'], required: true }, // 'time' (API access for X hours) or 'usage' (X API calls)
  costPerUnit: { type: Number, required: true }, // e.g., 10 (rupees per call or per hour)
  unitName: { type: String, default: 'credits' }, // e.g. 'calls', 'hours', 'requests'
  demoUrl: { type: String }, // For the hackathon demo, a mock URL/endpoint
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Service', serviceSchema);
