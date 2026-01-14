const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'purchase'], required: true }, // deposit = add money, purchase = buy pass
  description: { type: String },
  status: { type: String, default: 'success' }, // simplified for hackathon
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
