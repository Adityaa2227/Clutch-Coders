const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  totalLimit: { type: Number, required: true }, // Max calls or Max hours purchased
  remainingAmount: { type: Number, required: true }, // Remaining calls or time info? 
  // For time-based, we might use 'expiresAt' strictly. For usage, we use remainingAmount.
  // Let's support both. Even time-based could be "5 hours of usage" which decrements, OR "Access until X". 
  // Requirement says: "₹50 per day tool access" -> This implies Access UNTIL time.
  // "₹10 per API usage batch" -> This implies Usage decrement.
  
  // So for TIME based: use expiresAt. remainingAmount might be ignored or 1/0.
  // For USAGE based: use remainingAmount. expiresAt might be null or far future.
  
  expiresAt: { type: Date }, 
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  expiryWarningSent: { type: Boolean, default: false },
  expiryEmailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pass', passSchema);
