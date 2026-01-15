const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const EmailService = require('../services/EmailService');
const RedisService = require('../services/RedisService'); // Redis Support

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = function(io) {
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

        io.to('admin_room').emit('transaction_created', transaction);
    
        res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
      } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Order Creation Failed', error: err.message, details: err });
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
                io.to('admin_room').emit('payment_failed', transaction);
            }
            res.json({ msg: 'Logged failure' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        } finally {
            if (releaseLock) await releaseLock(); // Release lock
        }
    });
    
    // @route   POST api/wallet/verify-payment
    // @desc    Verify Razorpay Signature and Update Wallet
    // @access  Private
    router.post('/verify-payment', auth, async (req, res) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
      const userId = req.user.id;
      
      // 1. Acquire Distributed Lock
      const releaseLock = await RedisService.acquireLock(`wallet_lock:${userId}`, 10);
      if (!releaseLock) {
           return res.status(429).json({ msg: 'Wallet operation in progress. Please wait.' });
      }

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
               io.to('admin_room').emit('payment_failed', transaction);
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
            // Fallback
             const newTx = new Transaction({
                userId: user.id,
                amount: Number(amount),
                type: 'deposit',
                description: `Wallet Top-up (Razorpay: ${razorpay_payment_id})`,
                status: 'success',
                razorpayOrderId: razorpay_order_id
            });
            await newTx.save();
            // Assign to transaction variable for emission
            // Actually it is locally scoped, let's just use newTx
            io.to('admin_room').emit('payment_success', newTx);
        }

        if(transaction) {
            io.to('admin_room').emit('payment_success', transaction);
            // Send Email Receipt
            // Send Email Receipt (Non-blocking)
            EmailService.sendTransactionReceipt(user, transaction).catch(err => console.error("Email Error:", err.message));
        }
    
        res.json({ msg: 'Payment Verified', walletBalance: user.walletBalance, transaction });
    
      } catch (err) {
        console.error(err);
        res.status(500).send('Payment Verification Failed');
      } finally {
        if (releaseLock) await releaseLock(); 
      }
    });
    
    // @route   GET api/wallet/transactions
    // @desc    Get user transactions
    // @access  Private
    router.get('/transactions', auth, async (req, res) => {
      try {
        const transactions = await Transaction.find({ 
            userId: req.user.id,
            type: { $nin: ['cashback', 'referral_reward'] }
        }).sort({ createdAt: -1 });
        res.json(transactions);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    });
    
    // @route   POST api/wallet/withdraw
    // @desc    Withdraw funds from wallet
    // @access  Private
    router.post('/withdraw', auth, async (req, res) => {
      const { amount, upiId } = req.body;
      const userId = req.user.id;

      // 1. Acquire Distributed Lock
      const releaseLock = await RedisService.acquireLock(`wallet_lock:${userId}`, 15);
      if (!releaseLock) {
          return res.status(429).json({ msg: 'Wallet operation in progress. Please wait.' });
      }
      
      if (!amount || amount <= 0) {
          return res.status(400).json({ msg: 'Invalid amount' });
      }

      try {
        const user = await User.findById(req.user.id);
        
        if (user.walletBalance < amount) {
            return res.status(400).json({ msg: 'Insufficient funds' });
        }

        // Deduct from wallet
        user.walletBalance -= Number(amount);
        await user.save();

        // Create Withdrawal Transaction
        const transaction = new Transaction({
            userId: req.user.id,
            amount: Number(amount),
            type: 'withdrawal',
            description: `Withdrawal to UPI: ${upiId}`,
            status: 'success', // Auto-success for demo
            razorpayOrderId: `wd_${Date.now()}` // Fake ID for consistency
        });
        await transaction.save();
        
        // Notify Admin of withdrawal
        io.to('admin_room').emit('transaction_created', transaction);

        // Send Email Receipt
        // Send Email Receipt (Non-blocking)
        EmailService.sendTransactionReceipt(user, transaction).catch(err => console.error("Email Error:", err.message));

        res.json({ msg: 'Withdrawal Successful', walletBalance: user.walletBalance, transaction });

      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      } finally {
        if (releaseLock) await releaseLock();
      }
    });

    return router;
};
