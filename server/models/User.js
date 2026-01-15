const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google Auth
  googleId: { type: String, unique: true, sparse: true }, // Sparse: allows multiple nulls
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  walletBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true }, 
  isWalletLocked: { type: Boolean, default: false },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalCashbackEarned: { type: Number, default: 0 },
  totalReferralRewards: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
