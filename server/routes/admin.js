const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Pass = require('../models/Pass');
const UsageLog = require('../models/UsageLog');
const AccessLog = require('../models/AccessLog');
const Service = require('../models/Service');

module.exports = (io) => {
    
    // Middleware to ensure admin
    const adminAuth = async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (user.role !== 'admin') {
                return res.status(403).json({ msg: 'Access Denied: Admin only' });
            }
            next();
        } catch (err) {
            res.status(500).send('Server Error');
        }
    };

    // @route   GET api/admin/stats
    // @desc    Get aggregate dashboard stats
    router.get('/stats', auth, adminAuth, async (req, res) => {
        try {
            // Calculate Revenue (Sum of 'purchase' amounts)
            // Note: 'purchase' usually reduces wallet balance (negative?), check Transaction logic.
            // If stored as positive amount in Transaction model, use sum. 
            // Based on previous logs, purchase was -50. So we sum ABS value or check if stored as positive.
            // Let's assume absolute magnitude matters for Revenue.
            // Actually, in `wallet.js` handleBuyPass:
            // const tx = new Transaction({ type: 'purchase', amount: -cost, ... });
            // So amount is negative. We need to sum them and absolute the result.

            // Determine Time Range
            const range = req.query.range || '24h';
            let startDate, groupBy, formatLabel;
            
            if (range === '1h') {
                startDate = new Date(Date.now() - 60 * 60 * 1000);
                groupBy = { $minute: { date: "$createdAt", timezone: "Asia/Kolkata" } };
                formatLabel = (val) => `${val < 10 ? '0'+val : val}m`;
            } else if (range === '7d') {
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                groupBy = { 
                    day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                    month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } }
                };
                formatLabel = (val) => `${val.day}/${val.month}`;
            } else { // Default 24h
                startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                groupBy = { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } };
                formatLabel = (val) => `${val}:00`;
            }

            const [
                totalRevenueResult,
                activeUsersCount,
                activePassesCount,
                liveServicesCount,
                failedTxCount,
                recentTransactions,
                revenueTrend
            ] = await Promise.all([
                Transaction.aggregate([
                    { $match: { type: 'purchase', status: 'success' } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]),
                User.countDocuments({}),
                Pass.countDocuments({ status: 'active' }),
                Service.countDocuments({ active: true }),
                Transaction.countDocuments({ status: 'failed' }),
                Transaction.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email'),
                
                // Fetch Raw Range Data for JS Aggregation (Safer/Simpler)
                Transaction.find({ 
                    type: 'purchase', 
                    status: 'success',
                    createdAt: { $gte: startDate }
                }).sort({ createdAt: 1 })
            ]);

            // Handle potential null/empty
            const totalRevenueraw = totalRevenueResult[0]?.total || 0;
            const totalRevenue = Math.abs(totalRevenueraw);

            // JS Aggregation
            let chartData = [];
            const buckets = {};

            // Initialize buckets and fill function
            if (range === '1h') {
                // Minute buckets (0-59)
                // Initialize all minutes for the last hour relative to NOW
                const now = new Date();
                for(let i=0; i<60; i+=5) { // 5 min intervals
                     const d = new Date(now.getTime() - (60 - i) * 60000);
                     const label = `${d.getHours()}:${d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes()}`;
                     buckets[label] = 0;
                     chartData.push({ name: label, value: 0, ts: d.getTime() }); // ts for sorting if needed
                }
                
                revenueTrend.forEach(tx => {
                    const txDate = new Date(tx.createdAt);
                     // Find closest bucket?
                     // Simple mapping:
                     const label = `${txDate.getHours()}:${txDate.getMinutes() < 10 ? '0'+txDate.getMinutes() : txDate.getMinutes()}`;
                     // This is too granular/noisy.
                     // Let's just map to predefined buckets
                });
                
                // Redo: Just 12 points (5 min intervals)
                chartData = [];
                const endTime = Date.now();
                for (let i = 12; i >= 0; i--) {
                    const t = endTime - i * 5 * 60 * 1000;
                    const d = new Date(t);
                    const label = `${d.getHours()}:${d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes()}`;
                    
                    // Sum txs in this 5 min window
                    const windowStart = t - 5 * 60 * 1000;
                    const total = revenueTrend
                        .filter(tx => {
                            const txTime = new Date(tx.createdAt).getTime();
                            return txTime > windowStart && txTime <= t;
                        })
                        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
                        
                    chartData.push({ name: label, value: total });
                }

            } else if (range === '7d') {
                // Last 7 days
                const today = new Date();
                chartData = [];
                for(let i=6; i>=0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
                    
                    // Filter txs for this day (local time approx)
                    // Checking same Day/Month/Year
                    const total = revenueTrend
                        .filter(tx => {
                            const t = new Date(tx.createdAt);
                            return t.getDate() === d.getDate() && t.getMonth() === d.getMonth();
                        })
                        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
                        
                    chartData.push({ name: dayLabel, value: total });
                }
            } else {
                // 24h (Hourly)
                const now = new Date();
                chartData = [];
                for(let i=24; i >= 0; i-=4) { // Every 4 hours? Or all 24?
                    // Let's do every 2 hours
                }
                // Simpler: Just last 24h, buckets of 1h
                for(let i=23; i>=0; i--) {
                    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                    const hourLabel = `${d.getHours()}:00`;
                    
                    const total = revenueTrend
                        .filter(tx => {
                            const t = new Date(tx.createdAt);
                            // Match Hour and Date
                            return t.getHours() === d.getHours() && t.getDate() === d.getDate();
                        })
                        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
                    
                   if (i % 4 === 0 || i === 0) { // Concise 
                       chartData.push({ name: hourLabel, value: total });
                   }
                }
            }


            res.json({
                revenue: totalRevenue,
                activeUsers: activeUsersCount,
                activePasses: activePassesCount,
                liveServices: liveServicesCount,
                failedTransactions: failedTxCount,
                recentTransactions,
                revenueTrend: chartData
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET api/admin/health
    // @desc    System health check
    router.get('/health', async (req, res) => {
        const healthcheck = {
            uptime: process.uptime(),
            message: 'OK',
            timestamp: Date.now()
        };
        try {
            res.send(healthcheck);
        } catch (error) {
            healthcheck.message = error;
            res.status(503).send();
        }
    });


    // @route   GET api/admin/passes
    // @desc    Get all passes (Live Registry)
    router.get('/passes', auth, adminAuth, async (req, res) => {
        try {
            const passes = await Pass.find()
                .populate('userId', 'name email')
                .populate('serviceId', 'name type unitName')
                .sort({ createdAt: -1 });
            res.json(passes);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE api/admin/passes/:id
    // @desc    Revoke/Delete a pass
    router.delete('/passes/:id', auth, adminAuth, async (req, res) => {
        try {
            await Pass.findByIdAndDelete(req.params.id);
            res.json({ msg: 'Pass revoked' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    return router;
};
