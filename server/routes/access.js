const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Pass = require('../models/Pass');
const UsageLog = require('../models/UsageLog');
const AccessLog = require('../models/AccessLog');
const Service = require('../models/Service');

module.exports = function (io) {

  // @route   POST api/access/:serviceId
  // @desc    Attempt to access/use a service
  // @access  Private
  router.post('/:serviceId', auth, async (req, res) => {
    const serviceId = req.params.serviceId;
    const userId = req.user.id;
    let serviceName = "Unknown Service";

    try {
      const service = await Service.findById(serviceId);
      if(service) serviceName = service.name;

      // 1. Find a valid pass
      const passes = await Pass.find({
        userId: userId,
        serviceId: serviceId,
        status: 'active'
      });

      if (!passes || passes.length === 0) {
        // Log Failure
        await new AccessLog({ userId, serviceId, status: 'failed', failureReason: 'No active pass', ip: req.ip }).save();
        io.to('admin_room').emit('access_log', { userId, serviceId, status: 'failed', reason: 'No active pass', timestamp: new Date() });
        return res.status(403).json({ msg: 'No active pass found for this service', accessGranted: false });
      }

      // 2. Select the best pass
      let validPass = null;

      for (let pass of passes) {
        // Check Expiry
        if (pass.expiresAt && new Date() > new Date(pass.expiresAt)) {
          pass.status = 'expired';
          await pass.save();
          continue; 
        }

        // Check Usage Limit
        if (pass.remainingAmount <= 0) {
           pass.status = 'expired';
           await pass.save();
           continue;
        }
        
        validPass = pass;
        break; 
      }

      if (!validPass) {
        await new AccessLog({ userId, serviceId, status: 'failed', failureReason: 'Passes expired/empty', ip: req.ip }).save();
        io.to('admin_room').emit('access_log', { userId, serviceId, status: 'failed', reason: 'Passes expired', timestamp: new Date() });
        return res.status(403).json({ msg: 'All passes expired or empty', accessGranted: false });
      }

      // 3. Process Usage
      let usageAmount = 1; // Default consumption per call
      if (req.body && req.body.amount) usageAmount = req.body.amount;

      if (service && service.type === 'usage') {
        if (validPass.remainingAmount < usageAmount) {
             await new AccessLog({ userId, serviceId, status: 'failed', failureReason: 'Insufficient usage balance', ip: req.ip }).save();
            return res.status(403).json({ msg: 'Not enough usage remaining in pass', accessGranted: false });
        }
        validPass.remainingAmount -= usageAmount;
        if (validPass.remainingAmount <= 0) {
            validPass.status = 'expired';
        }
      } 

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

      // Log Access Success
      const accessLog = new AccessLog({ userId, serviceId, status: 'success', ip: req.ip });
      await accessLog.save();

      // 5. Emit Realtime Updates
      // Notify User
      io.to(userId).emit('usage_update', {
        passId: validPass._id,
        serviceId: serviceId,
        remainingAmount: validPass.remainingAmount,
        status: validPass.status
      });

      // Notify Admin
      io.to('admin_room').emit('usage_logged', {
         logId: log._id,
         userId,
         userName: req.user.name, // Assuming req.user populated by auth middleware has name? Valid check: Auth middleware usually just decodes ID. Let's fetch or just send ID.
         // Actually auth middleware often doesn't populate name. Let's send ID and let admin fetch or hydrate.
         // But for realtime "feed", minimal data is better.
         serviceName: serviceName,
         amountUsed: usageAmount,
         timestamp: new Date()
      });
      
      io.to('admin_room').emit('access_log', { 
          userId, 
          serviceId,
          serviceName,
          status: 'success', 
          timestamp: new Date() 
      });


      // 6. Return Success
      res.json({
        msg: 'Access Granted',
        accessGranted: true,
        remainingAmount: validPass.remainingAmount,
        serviceName: serviceName,
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
