const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Service = require('../models/Service');
const Pass = require('../models/Pass');
const Transaction = require('../models/Transaction');
const UsageLog = require('../models/UsageLog');

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

    // Check for ANY existing pass for this service (Active preferred, but Expired is okay to revive)
    // We sort by status (active first) just in case there are duplicates from before
    let existingPass = await Pass.findOne({ userId: user.id, serviceId: service.id })
        .sort({ status: 1 }); // 'active' comes before 'expired' alphabetically? No. 'active' < 'expired'. 
        // actually 'a' < 'e', so active is first. Perfect.

    let passToReturn;

    if (existingPass) {
        // MERGE / REVIVE LOGIC
        
        // Reactivate if expired
        if (existingPass.status === 'expired') {
            existingPass.status = 'active';
            // Reset counters if needed, but usually we just ADD to them.
            // If it was usage based and 0, adding amount is correct.
            // If it was time based and expired, we need to reset start time?
        }

        if (service.type === 'time') {
             const hours = Number(amount);
             // If expired, start from NOW. If active, extend from current expiry.
             const baseTime = (existingPass.expiresAt && existingPass.expiresAt > new Date()) 
                ? existingPass.expiresAt 
                : new Date();
             
             const newExpiry = new Date(baseTime);
             newExpiry.setHours(newExpiry.getHours() + hours);
             existingPass.expiresAt = newExpiry;
        } else {
             // Usage based
             // If it was expired, remainingAmount might be 0. We just add.
             existingPass.remainingAmount += Number(amount);
             existingPass.totalLimit += Number(amount);
        }
        await existingPass.save();
        passToReturn = existingPass;
    } else {
        // CREATE NEW LOGIC (Only if absolutely no pass exists)
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

    res.json({ msg: 'Pass purchased successfully', pass: passToReturn, walletBalance: user.walletBalance });

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
