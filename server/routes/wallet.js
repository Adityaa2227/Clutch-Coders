const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @route   POST api/wallet/topup
// @desc    Add funds to wallet (Mock)
// @access  Private
router.post('/topup', auth, async (req, res) => {
  const { amount } = req.body; // In a real app, verifying payment ID happens here

  if (!amount || amount <= 0) {
    return res.status(400).json({ msg: 'Invalid amount' });
  }

  try {
    const user = await User.findById(req.user.id);

    // Update wallet
    user.walletBalance += Number(amount);
    await user.save();

    // Create Transaction
    const transaction = new Transaction({
      userId: user.id,
      amount: Number(amount),
      type: 'deposit',
      description: 'Wallet Top-up'
    });
    await transaction.save();

    res.json({ msg: 'Wallet updated', walletBalance: user.walletBalance, transaction });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/transactions
// @desc    Get user transactions
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
