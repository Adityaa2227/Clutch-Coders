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

                
            // Calculate Today's Revenue (Since midnight)
            const startOfToday = new Date();
            startOfToday.setHours(0,0,0,0);
            
            const todayRevenueResult = await Transaction.aggregate([
                { $match: { 
                    type: 'purchase', 
                    status: 'success',
                    createdAt: { $gte: startOfToday }
                }},
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const todayRevenue = Math.abs(todayRevenueResult[0]?.total || 0);

            // ... (keep graph logic for 1h and 7d)
            if (range === '1h') {
                 // Redo: Just 12 points (5 min intervals)
                chartData = [];
                const endTime = Date.now();
                for (let i = 12; i >= 0; i--) {
                    const t = endTime - i * 5 * 60 * 1000;
                    const d = new Date(t);
                    const label = `${d.getHours()}:${d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes()}`;
                    
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
                const today = new Date();
                chartData = [];
                for(let i=6; i>=0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
                    
                    const total = revenueTrend
                        .filter(tx => {
                            const t = new Date(tx.createdAt);
                            return t.getDate() === d.getDate() && t.getMonth() === d.getMonth();
                        })
                        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
                        
                    chartData.push({ name: dayLabel, value: total });
                }
            } else {
                // 24h (Hourly) - Fixed to show all 24 hours
                const now = new Date();
                chartData = [];
                for(let i=23; i>=0; i--) {
                    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                    const hourLabel = `${d.getHours()}:00`;
                    
                    const total = revenueTrend
                        .filter(tx => {
                            const t = new Date(tx.createdAt);
                            // Relaxed check: just matching the hour bucket (ignoring slight date diffs at boundaries if needed, but exact is fine)
                            // Actually, just checking hour matching within the last 24h dataset is safe since dataset is limited to 24h
                            return t.getHours() === d.getHours() && t.getDate() === d.getDate();
                        })
                        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
                    
                    chartData.push({ name: hourLabel, value: total });
                }
            }

            res.json({
                revenue: totalRevenue,
                todayRevenue: todayRevenue,
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

    // @route   GET api/admin/transactions
    // @desc    Get full transaction history
    router.get('/transactions', auth, adminAuth, async (req, res) => {
        try {
            // Limit to last 500 for performance, or implement pagination later
            const transactions = await Transaction.find()
                .sort({ createdAt: -1 })
                .limit(500)
                .populate('userId', 'name email');
            res.json(transactions);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET api/admin/users
    // @desc    Get all users with activity status
    router.get('/users', auth, adminAuth, async (req, res) => {
        try {
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            
            // Get recent activity for "Online/Active" status (last 15 mins)
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
            const activeUserIds = await AccessLog.distinct('userId', { 
                timestamp: { $gte: fifteenMinsAgo },
                userId: { $ne: null }
            });
            const activeSet = new Set(activeUserIds.map(id => id.toString()));

            // Enrich with "last seen" if needed, but for now simple boolean "isActive"
            // If we want exact last seen, we'd need aggregation. 
            // Let's do a quick optimization: simpler is better for now. 
            
            const enrichedUsers = users.map(user => ({
                ...user.toObject(),
                isActive: activeSet.has(user._id.toString())
            }));

            res.json(enrichedUsers);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET api/admin/users/:id
    // @desc    Get specific user details (Passes, Transactions)
    router.get('/users/:id', auth, adminAuth, async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) return res.status(404).json({ msg: 'User not found' });

            const [activePasses, transactions] = await Promise.all([
                Pass.find({ userId: req.params.id, status: 'active' }).populate('serviceId', 'name type unitName'),
                Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(100)
            ]);

            res.json({
                user,
                activePasses,
                transactions
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT api/admin/users/:id/suspend
    // @desc    Toggle user suspension
    router.put('/users/:id/suspend', auth, adminAuth, async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ msg: 'User not found' });

            user.status = user.status === 'suspended' ? 'active' : 'suspended';
            await user.save();

            res.json({ msg: `User ${user.status}`, user });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    return router;
};
