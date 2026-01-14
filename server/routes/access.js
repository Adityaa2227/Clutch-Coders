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
        // Log Failure (Non-blocking)
        new AccessLog({ userId, serviceId, status: 'failed', failureReason: 'No active pass', ip: req.ip }).save().catch(e => console.error("Log Error:", e.message));
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
        new AccessLog({ userId, serviceId, status: 'failed', failureReason: 'Passes expired/empty', ip: req.ip }).save().catch(e => console.error("Log Error:", e.message));
        io.to('admin_room').emit('access_log', { userId, serviceId, status: 'failed', reason: 'Passes expired', timestamp: new Date() });
        return res.status(403).json({ msg: 'All passes expired or empty', accessGranted: false });
      }

      // 3. Process Usage
      let usageAmount = 1; // Default consumption per call
      if (req.body && req.body.amount) usageAmount = req.body.amount;

      if (service && service.type === 'usage') {
        if (validPass.remainingAmount < usageAmount) {
             new AccessLog({ userId, serviceId, status: 'failed', failureReason: 'Insufficient usage balance', ip: req.ip }).save().catch(e => console.error("Log Error:", e.message));
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
      // Log Access Success (Non-blocking)
      new AccessLog({ userId, serviceId, status: 'success', ip: req.ip }).save().catch(e => console.error("Log Error:", e.message));

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


      // 6. Return Success / Process Service Logic
      let responseData = {
          item: "Service Consumed Successfully",
          timestamp: new Date()
      };

      // AI Service Integration (Groq)
      if (serviceName.match(/ai|gpt/i) && req.body.prompt) {
          try {
             // Groq API (OpenAI Compatible)
             const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;
             const apiRes = await fetch(groqUrl, {
                 method: 'POST',
                 headers: { 
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                 },
                 body: JSON.stringify({
                     model: "llama-3.3-70b-versatile", 
                     messages: [{ role: "user", content: req.body.prompt }]
                 })
             });
             const data = await apiRes.json();
             
             if (data.choices && data.choices[0].message) {
                 responseData.response = data.choices[0].message.content;
             } else {
                 // Fallback on Vendor Error
                 console.error("Groq Error:", JSON.stringify(data));
                 const errorMsg = data.error?.message || "Unknown Provider Error";
                 responseData.response = `[System: Groq API Error '${data.error?.code || 'Error'}'. Falling back to simulation.]\n\n${errorMsg}\n\n(Simulated Reply): Hello! I am Flex AI via Groq (Simulation). Rate limit or key issue detected.`;
             }
          } catch (aiErr) {
              console.error("AI Service Error:", aiErr);
              responseData.response = "Internal System: Could not reach Groq provider. (Network/Config Error).";
          }
      }

      res.json({
        msg: 'Access Granted',
        accessGranted: true,
        remainingAmount: validPass.remainingAmount,
        serviceName: serviceName,
        data: responseData
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  return router;
};
