const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST api/wallet/create-order
// @desc    Create Razorpay Order
// @access  Private
router.post('/create-order', auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ msg: 'Invalid amount' });

  try {
    const options = {
      amount: Number(amount) * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${req.user.id.substring(0, 5)}`
    };

    const order = await razorpay.orders.create(options);

    // Create Pending Transaction
    const transaction = new Transaction({
      userId: req.user.id,
      amount: Number(amount),
      type: 'deposit',
      description: 'Initiated Wallet Top-up',
      status: 'pending',
      razorpayOrderId: order.id
    });
    await transaction.save();

    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    res.status(500).send('Order Creation Failed');
  }
});

// @route   POST api/payment-failed
// @desc    Mark transaction as failed
// @access  Private
router.post('/payment-failed', auth, async (req, res) => {
    const { razorpay_order_id, reason } = req.body;
    try {
        const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
        if (transaction) {
            transaction.status = 'failed';
            transaction.description = `Failed Top-up: ${reason}`;
            await transaction.save();
        }
        res.json({ msg: 'Logged failure' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/wallet/verify-payment
// @desc    Verify Razorpay Signature and Update Wallet
// @access  Private
router.post('/verify-payment', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  try {
    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });

    if (expectedSignature !== razorpay_signature) {
       if (transaction) {
           transaction.status = 'failed';
           transaction.description = 'Invalid Signature';
           await transaction.save();
       }
       return res.status(400).json({ msg: 'Invalid Payment Signature' });
    }

    // 2. Update Wallet (Only after successful verification)
    const user = await User.findById(req.user.id);
    
    // Check if already processed to prevent double crediting
    if (transaction && transaction.status === 'success') {
        return res.json({ msg: 'Payment already verified', walletBalance: user.walletBalance, transaction });
    }

    user.walletBalance += Number(amount);
    await user.save();

    // 3. Update Transaction
    if (transaction) {
        transaction.status = 'success';
        transaction.description = `Wallet Top-up (Razorpay: ${razorpay_payment_id})`;
        await transaction.save();
    } else {
        // Fallback if transaction wasn't found (shouldn't happen with correct flow)
        const newTx = new Transaction({
            userId: user.id,
            amount: Number(amount),
            type: 'deposit',
            description: `Wallet Top-up (Razorpay: ${razorpay_payment_id})`,
            status: 'success',
            razorpayOrderId: razorpay_order_id
        });
        await newTx.save();
    }

    res.json({ msg: 'Payment Verified', walletBalance: user.walletBalance, transaction });

  } catch (err) {
    console.error(err);
    res.status(500).send('Payment Verification Failed');
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
