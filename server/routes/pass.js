const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Service = require('../models/Service');
const Pass = require('../models/Pass');
const Transaction = require('../models/Transaction');
const UsageLog = require('../models/UsageLog');
const EmailService = require('../services/EmailService');

// @route   POST api/passes/buy
// @desc    Buy a pass for a service
// @access  Private
router.post('/buy', auth, async (req, res) => {
  const { serviceId, amount } = req.body; // amount could be 'number of api calls' or 'days' depending on implementation
  // Simplified: user sends "amount" (integer).
  
  // Logic: 
  // 1. Get Service cost
  // 2. Calculate total cost = amount * costPerUnit
  // 3. Check User Wallet
  // 4. Deduct Wallet
  // 5. Create Pass

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ msg: 'Service not found' });

    const totalCost = Number(amount) * service.costPerUnit;

    const user = await User.findById(req.user.id);
    if (user.walletBalance < totalCost) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    // Deduct Funds
    user.walletBalance -= totalCost;
    await user.save();

    // Create Transaction for Purchase
    const transaction = new Transaction({
      userId: user.id,
      amount: -totalCost,
      type: 'purchase',
      description: `Bought pass for ${service.name} (${amount} ${service.unitName})`
    });
    await transaction.save();

    // ==========================================
    let cashbackEarned = 0;

    // ==========================================
    // 🎁 REWARDS & CASHBACK LOGIC
    // ==========================================
    try {
        // 1. CASHBACK ENGINE
        const Offer = require('../models/Offer');
        // Find active cashback offer (simplified: take first active)
        const activeOffer = await Offer.findOne({ type: 'cashback', isActive: true });
        
        if (activeOffer) {
            // formula: (cost * percentage / 100) limited by maxCap
            const rawCashback = (totalCost * activeOffer.percentage) / 100;
            const cashbackAmount = Math.min(rawCashback, activeOffer.maxCap);
            
            if (cashbackAmount > 0) {
                // Credit User Wallet
                user.walletBalance += cashbackAmount;
                user.totalCashbackEarned += cashbackAmount;
                cashbackEarned = cashbackAmount;
                
                // Create Cashback Transaction
                const cbTx = new Transaction({
                    userId: user.id,
                    amount: cashbackAmount,
                    type: 'cashback',
                    description: `Cashback: ${activeOffer.name}`,
                    status: 'success'
                });
                await cbTx.save();
            }
        }
        
        // ... Referral Logic (kept as is, just ensuring variable scope doesn't break) ...
        // 2. REFERRAL ENGINE
        // Check if this is the user's FIRST purchase ever (to trigger referral reward)
        const purchaseCount = await Transaction.countDocuments({ userId: user.id, type: 'purchase' });
        
        if (purchaseCount === 1 && user.referredBy) {
            const Referral = require('../models/Referral');
            const referral = await Referral.findOne({ referrerId: user.referredBy, refereeId: user.id, status: 'pending' });
            
            if (referral) {
                const REFERRER_REWARD = 5; 
                const REFEREE_REWARD = 2.5;

                const referrer = await User.findById(user.referredBy);
                if (referrer) {
                    referrer.walletBalance += REFERRER_REWARD;
                    referrer.totalReferralRewards += REFERRER_REWARD;
                    await referrer.save();

                    await Transaction.create({
                        userId: referrer.id,
                        amount: REFERRER_REWARD,
                        type: 'referral_reward',
                        description: `Referral Bonus: ${user.name} made first purchase`,
                        status: 'success'
                    });
                }

                user.walletBalance += REFEREE_REWARD;
                // Add to cashbackEarned for display? Or keep separate? 
                // Using 'cashbackEarned' as a generic 'rewardsEarned' for this transaction display is good.
                cashbackEarned += REFEREE_REWARD; 
                
                await Transaction.create({
                    userId: user.id,
                    amount: REFEREE_REWARD,
                    type: 'referral_reward',
                    description: 'Referral Bonus: Used invitation code',
                    status: 'success'
                });

                referral.status = 'completed';
                referral.completedAt = new Date();
                referral.rewardAmount = REFERRER_REWARD; 
                await referral.save();
            }
        }
        
        await user.save();

    } catch (rewardErr) {
        console.error("Reward Engine Error:", rewardErr);
    }
    // ==========================================

    // Check for ANY existing pass for this service (Active preferred, but Expired is okay to revive)
    let existingPass = await Pass.findOne({ userId: user.id, serviceId: service.id })
        .sort({ status: 1 }); 

    let passToReturn;

    if (existingPass) {
        // MERGE / REVIVE LOGIC
        if (existingPass.status === 'expired') {
            existingPass.status = 'active';
        }

        if (service.type === 'time') {
             const hours = Number(amount);
             const baseTime = (existingPass.expiresAt && existingPass.expiresAt > new Date()) 
                ? existingPass.expiresAt 
                : new Date();
             
             const newExpiry = new Date(baseTime);
             newExpiry.setHours(newExpiry.getHours() + hours);
             existingPass.expiresAt = newExpiry;
        } else {
             existingPass.remainingAmount += Number(amount);
             existingPass.totalLimit += Number(amount);
        }
        await existingPass.save();
        passToReturn = existingPass;
    } else {
        // CREATE NEW LOGIC
        const newPass = new Pass({
          userId: user.id,
          serviceId: service.id,
          totalLimit: amount,
          remainingAmount: amount, 
          status: 'active'
        });

        if (service.type === 'time') {
           const hours = Number(amount);
           const expiry = new Date();
           expiry.setHours(expiry.getHours() + hours);
           newPass.expiresAt = expiry;
        }

        await newPass.save();
        passToReturn = newPass;
    }

    // Send Email Receipt
    // Send Email Receipt (Non-blocking)
    EmailService.sendTransactionReceipt(user, transaction, service.name).catch(err => console.error("Email Error:", err.message));

    res.json({ 
        msg: 'Pass purchased successfully', 
        pass: passToReturn, 
        walletBalance: user.walletBalance,
        cashbackEarned: cashbackEarned 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route   GET api/passes/usage
// @desc    Get user's usage history
// @access  Private
router.get('/usage', auth, async (req, res) => {
  try {
    console.log(`[PASS] Fetching usage logs for User: ${req.user.id}`);
    const logs = await UsageLog.find({ userId: req.user.id })
        .populate('serviceId', ['name', 'type', 'unitName'])
        .sort({ timestamp: -1 });
    console.log(`[PASS] Found ${logs.length} usage logs`);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/passes/my-passes
// @desc    Get logged in user's passes
// @access  Private
router.get('/my-passes', auth, async (req, res) => {
  try {
    const passes = await Pass.find({ userId: req.user.id })
        .populate('serviceId', ['name', 'type', 'unitName', 'demoUrl'])
        .sort({ createdAt: -1 });
    res.json(passes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
