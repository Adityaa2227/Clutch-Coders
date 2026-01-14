const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Welcome Bonus"
  type: { type: String, enum: ['cashback', 'quest'], required: true },
  description: { type: String },
  
  // Cashback Specific
  percentage: { type: Number }, // e.g. 5 for 5%
  maxCap: { type: Number }, // e.g. 5
  
  // Quest Specific (Future use)
  condition: { type: String }, 
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', offerSchema);
