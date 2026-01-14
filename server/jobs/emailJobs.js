const cron = require('node-cron');
const Pass = require('../models/Pass');
const User = require('../models/User'); // Need to populate user
const EmailService = require('../services/EmailService');

const initEmailJobs = () => {
    console.log('🕒 EmailJobs: Initializing Cron Jobs...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        // console.log('🕒 EmailJobs: Checking for expiring passes...');

        try {
            const now = new Date();
            const warningThresholdTime = new Date(now.getTime() + 10 * 60000); // 10 mins from now

            // 1. WARNING: Time-Based Passes (Expiring in <= 10 mins)
            const expiringTimePasses = await Pass.find({
                status: 'active',
                expiresAt: { $lte: warningThresholdTime, $ne: null },
                expiryWarningSent: false
            }).populate('userId serviceId');

            for (const pass of expiringTimePasses) {
                // If service is usage based, ignore this check (double safety)
                if (pass.serviceId.type === 'usage') continue; 

                // Send Email
                await EmailService.sendExpiryWarning(pass.userId, pass);
                
                // Update Flag
                pass.expiryWarningSent = true;
                await pass.save();
                console.log(`⚠️ Sent Expiry Warning for Pass ${pass._id}`);
            }

            // 2. WARNING: Usage-Based Passes (Redundant if handled by usage event, but good backup)
            const expiringUsagePasses = await Pass.find({
                status: 'active',
                remainingAmount: { $lte: 2 },
                expiresAt: null, // Usage based usually don't have expiry, or we check usage type
                expiryWarningSent: false
            }).populate('userId serviceId');

             for (const pass of expiringUsagePasses) {
                if (pass.serviceId.type !== 'usage') continue;

                await EmailService.sendExpiryWarning(pass.userId, pass);
                pass.expiryWarningSent = true;
                await pass.save();
                console.log(`⚠️ Sent Usage Warning for Pass ${pass._id}`);
            }

            // 3. EXPIRED: Passes that have actually expired
            const expiredPasses = await Pass.find({
                // Status might still be 'active' if lazy update, or 'expired' but email not sent
                // We trust the query to find what NEEDS email
                $or: [
                    { status: 'expired', expiryEmailSent: false },
                    { expiresAt: { $lt: now }, status: 'active', expiryEmailSent: false }
                ]
            }).populate('userId serviceId');

            for (const pass of expiredPasses) {
                // Double check if it really is expired (if query caught active ones)
                if (pass.expiresAt && pass.expiresAt < now) {
                     // It is expired
                     if (pass.status === 'active') {
                         pass.status = 'expired'; // Lazy update
                     }
                     
                     await EmailService.sendExpiredNotice(pass.userId, pass);
                     pass.expiryEmailSent = true;
                     await pass.save();
                     console.log(`❌ Sent Expired Notice for Pass ${pass._id}`);
                } else if (pass.status === 'expired') {
                     // Already marked expired but email not sent
                     await EmailService.sendExpiredNotice(pass.userId, pass);
                     pass.expiryEmailSent = true;
                     await pass.save();
                     console.log(`❌ Sent Expired Notice for Pass ${pass._id}`);
                }
            }

        } catch (err) {
            console.error('EmailJobs Error:', err);
        }
    });
};

module.exports = initEmailJobs;
