const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Offer = require('../models/Offer');

module.exports = function(io) {

    // ===========================
    // USER ROUTES
    // ===========================

    // @route   POST api/rewards/validate-referral
    // @desc    Validate a referral code
    router.post('/validate-referral', async (req, res) => {
        const { code } = req.body;
        try {
            const referrer = await User.findOne({ referralCode: code });
            if (!referrer) return res.status(404).json({ msg: 'Invalid referral code' });
            
            res.json({ msg: 'Valid Code', referrerName: referrer.name });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   POST api/rewards/claim-referral
    // @desc    Link user to a referrer (only if new user)
    router.post('/claim-referral', auth, async (req, res) => {
        const { code } = req.body;
        try {
            const user = await User.findById(req.user.id);
            if (user.referredBy) return res.status(400).json({ msg: 'Already referred by someone' });

            const referrer = await User.findOne({ referralCode: code });
            if (!referrer) return res.status(404).json({ msg: 'Invalid referral code' });

            if (referrer.id === user.id) return res.status(400).json({ msg: 'Cannot refer yourself' });

            // Link them
            user.referredBy = referrer.id;
            await user.save();

            // Create Referral Record
            const referral = new Referral({
                referrerId: referrer.id,
                refereeId: user.id,
                status: 'pending' // Waits for first purchase
            });
            await referral.save();

            res.json({ msg: 'Referral Applied', referrer: referrer.name });

        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET api/rewards/my-rewards
    // @desc    Get user's rewards stats
    router.get('/my-rewards', auth, async (req, res) => {
        try {
            let user = await User.findById(req.user.id);

            // Lazy Generation: If user doesn't have a code, generate one now
            if (!user.referralCode) {
                const crypto = require('crypto');
                user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
                await user.save();
            }

            
            // Fetch Reward Transactions
            const Transaction = require('../models/Transaction');
            const rewardHistory = await Transaction.find({
                userId: req.user.id,
                type: { $in: ['cashback', 'referral_reward'] }
            }).sort({ createdAt: -1 });

            const referrals = await Referral.find({ referrerId: req.user.id }).populate('refereeId', 'name createdAt');
            
            res.json({
                walletBalance: user.walletBalance,
                totalCashback: user.totalCashbackEarned,
                totalReferralRewards: user.totalReferralRewards,
                referralCode: user.referralCode,
                referrals,
                rewardHistory // Send this to frontend
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // ===========================
    // ADMIN ROUTES
    // ===========================

    // @route   GET api/rewards/offers
    // @desc    Get all cashback/referral offers
    router.get('/offers', auth, adminAuth, async (req, res) => {
        try {
            const offers = await Offer.find().sort({ createdAt: -1 });
            res.json(offers);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    // @route   POST api/rewards/offers
    // @desc    Create/Update an offer
    router.post('/offers', auth, adminAuth, async (req, res) => {
        const { name, type, percentage, maxCap, isActive } = req.body;
        try {
            // Simplified: We assume 1 active cashback offer for now
            if (type === 'cashback') {
                // Deactivate others if new one is active? Or just allow multiple rules?
                // Let's create new.
                const offer = new Offer({
                    name, type, percentage, maxCap, isActive
                });
                await offer.save();
                res.json(offer);
            } else {
                res.status(400).send('Only cashback supported currently');
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });
    
    // @route   PUT api/rewards/offers/:id
    // @desc    Toggle offer status
    router.put('/offers/:id', auth, adminAuth, async (req, res) => {
        try {
            const offer = await Offer.findById(req.params.id);
            if(offer) {
                offer.isActive = !offer.isActive;
                await offer.save();
                res.json(offer);
            } else {
                res.status(404).json({msg: 'Offer not found'});
            }
        } catch (err) {
            res.status(500).send('Server Error');
        }
    });

    // Bootstrap Default Offer
    const ensureDefaultOffer = async () => {
        try {
            // Rename old "Welcome Cashback" to "Standard Cashback" if it exists
            await Offer.updateOne(
                { name: 'Welcome Cashback' },
                { 
                    $set: { 
                        name: 'Standard Cashback', 
                        description: 'Get 5% cashback up to ₹5 on every pass purchase!' 
                    } 
                }
            );

            const count = await Offer.countDocuments();
            if (count === 0) {
                console.log('Bootstrapping Default Cashback Offer...');
                await Offer.create({
                    name: 'Standard Cashback',
                    type: 'cashback',
                    percentage: 5,
                    maxCap: 5,
                    isActive: true,
                    description: 'Get 5% cashback up to ₹5 on every pass purchase!'
                });
            }
        } catch (err) {
            console.error('Failed to bootstrap offer:', err);
        }
    };
    ensureDefaultOffer();

    return router;
};
