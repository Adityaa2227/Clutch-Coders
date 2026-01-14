const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'purchase', 'withdrawal'], required: true }, // deposit = add money, purchase = buy pass, withdrawal = cash out
  description: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  razorpayOrderId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
