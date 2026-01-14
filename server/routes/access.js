const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Pass = require('../models/Pass');
const UsageLog = require('../models/UsageLog');
const Service = require('../models/Service');

module.exports = function (io) {

  // @route   POST api/access/:serviceId
  // @desc    Attempt to access/use a service
  // @access  Private
  router.post('/:serviceId', auth, async (req, res) => {
    try {
      const serviceId = req.params.serviceId;
      const userId = req.user.id;

      // 1. Find a valid pass
      // Logic: Find active passes for this user & service.
      const passes = await Pass.find({
        userId: userId,
        serviceId: serviceId,
        status: 'active'
      });

      if (!passes || passes.length === 0) {
        return res.status(403).json({ msg: 'No active pass found for this service', accessGranted: false });
      }

      // 2. Select the best pass (e.g. one expiring soonest, or just the first one)
      // We need to validate them one by one until we find a usable one
      let validPass = null;

      for (let pass of passes) {
        // Check Expiry (if exists)
        if (pass.expiresAt && new Date() > new Date(pass.expiresAt)) {
          pass.status = 'expired';
          await pass.save();
          continue; // Try next pass
        }

        // Check Usage Limit (if applicable)
        if (pass.remainingAmount <= 0) {
           // Should have been expired, but just in case
           pass.status = 'expired';
           await pass.save();
           continue;
        }
        
        validPass = pass;
        break; 
      }

      if (!validPass) {
        return res.status(403).json({ msg: 'All passes expired or empty', accessGranted: false });
      }

      // 3. Process Usage
      // If service/pass is usage-based, decrement.
      // We can check Service type, or just rely on the fact that time-based passes might have high remainingAmount or we don't decrement it?
      // Requirement says "Deduct usage atomically".
      // Let's lookup service to check type.
      const service = await Service.findById(serviceId);
      
      let usageAmount = 1; // Default consumption per call
      if (req.body && req.body.amount) usageAmount = req.body.amount; // Allow requesting multiple units?

      if (service.type === 'usage') {
        if (validPass.remainingAmount < usageAmount) {
            return res.status(403).json({ msg: 'Not enough usage remaining in pass', accessGranted: false });
        }
        validPass.remainingAmount -= usageAmount;
        if (validPass.remainingAmount <= 0) {
            validPass.status = 'expired';
        }
      } 
      // If type is 'time', we don't necessarily decrement remainingAmount unless we want to track "hours used" vs "hours purchased"?
      // Usually time-based is "Access provided until X date". So we just validate date (which we did).
      // But maybe we want to log usage anyway.

      await validPass.save();

      // 4. Log Usage
      console.log(`[ACCESS] Logging usage for User: ${userId}, Service: ${serviceId}, Pass: ${validPass._id}`);
      const log = new UsageLog({
        userId,
        serviceId,
        passId: validPass._id,
        amountUsed: usageAmount
      });
      await log.save();
      console.log('[ACCESS] Usage log saved:', log._id);

      // 5. Emit Realtime Update
      // Notify the user client to update their dashboard immediately
      io.to(userId).emit('usage_update', {
        passId: validPass._id,
        serviceId: serviceId,
        remainingAmount: validPass.remainingAmount,
        status: validPass.status
      });

      // 6. Return Success
      res.json({
        msg: 'Access Granted',
        accessGranted: true,
        remainingAmount: validPass.remainingAmount,
        serviceName: service.name,
        // Mock Response Data from the "Service"
        data: {
            item: "Simulated Data Result",
            timestamp: new Date()
        }
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  return router;
};
