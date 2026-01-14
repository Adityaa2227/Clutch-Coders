const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const EmailOTP = require('../models/EmailOTP');
const EmailService = require('../services/EmailService');
const crypto = require('crypto');
// Temporary Reset Route for Hackathon Demo
router.post('/reset-db', async (req, res) => {
    try {
        const Pass = require('../models/Pass');
        const UsageLog = require('../models/UsageLog');
        await Pass.deleteMany({});
        await UsageLog.deleteMany({});
        res.json({ msg: 'Database (Passes/Logs) Reset Successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/request-otp
// @desc    Request Email Verification OTP
// @access  Public
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // 2. Rate Limiting Logic (Simplified for MVP: Check existing OTP record)
        const existingOTP = await EmailOTP.findOne({ email });
        if (existingOTP) {
             // Block if request is too soon (< 1 min)
             const timeDiff = Date.now() - existingOTP.createdAt.getTime();
             if (timeDiff < 60000) { // 60 seconds
                 return res.status(429).json({ msg: 'Please wait before requesting another OTP' });
             }
        }

        // 3. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

        // 4. Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        // 5. Save to DB (Upsert)
        await EmailOTP.findOneAndUpdate(
            { email },
            { 
                email,
                otp: hashedOTP,
                expiresAt: new Date(Date.now() + 10 * 60000), // 10 mins
                attempts: 0,
                createdAt: Date.now()
            },
            { upsert: true, new: true } 
        );

        // 6. Send Email
        await EmailService.sendOTP(email, otp);

        res.json({ msg: 'OTP sent to email' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and Register User
// @access  Public
router.post('/verify-otp', async (req, res) => {
    const { email, otp, name, password, role } = req.body;

    if (!email || !otp || !name || !password) {
        return res.status(400).json({ msg: 'Please provide all fields' });
    }

    try {
        // 1. Find OTP Record
        const record = await EmailOTP.findOne({ email });
        if (!record) {
            return res.status(400).json({ msg: 'Invalid or Expired OTP' });
        }

        // 2. Check Expiry
        if (record.expiresAt < Date.now()) {
             await EmailOTP.deleteOne({ email });
             return res.status(400).json({ msg: 'OTP Expired' });
        }

        // 3. Check Attempts
        if (record.attempts >= 5) {
            await EmailOTP.deleteOne({ email }); // Secure fail
            return res.status(400).json({ msg: 'Too many failed attempts. Request a new OTP.' });
        }

        // 4. Verify Hash
        const isMatch = await bcrypt.compare(otp, record.otp);
        if (!isMatch) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // 5. SUCCESS: Create User
        // Double check user existence
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User exists' });

        const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

        user = new User({
            name,
            email,
            password,
            role: role || 'user',
            referralCode
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // 6. Delete OTP Record
        await EmailOTP.deleteOne({ email });

        // 7. Generate Token
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role, walletBalance: user.walletBalance } });
            }
        );

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const crypto = require('crypto'); // Ensure imported if not already

    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    user = new User({
      name,
      email,
      password,
      role: role || 'user',
      referralCode
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, walletBalance: user.walletBalance } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, walletBalance: user.walletBalance } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (email && email !== user.email) {
            // Check if email already exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ msg: 'Email already in use' });
            }
            user.email = email;
        }

        // Password Update Logic
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ msg: 'Current password is required to set a new one' });
            }
            
            // Check if user has a password set (social login users might not)
            if (user.password) {
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ msg: 'Invalid current password' });
                }
            } else {
                 // For social login users setting a password for the first time
                 // Ideally enforce some other verification, but for now we proceed or require currentPassword to match empty?
                 // Let's assume they must know the "current" which is null? 
                 // Actually, usually social users don't have a password. 
                 // Let's rely on standard flow: if password exists, verify it.
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.json({ 
            msg: 'Profile Updated', 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                walletBalance: user.walletBalance 
            } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/google
// @desc    Google Auth (Login/Register)
// @access  Public
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            // User exists - Login
            // If user has no googleId, link it now
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // User doesn't exist - Register
            const crypto = require('crypto');
            const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            
            user = new User({
                name,
                email,
                googleId,
                role: 'user', // Default role
                password: '', // No password
                referralCode
            });
            await user.save();
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role, walletBalance: user.walletBalance } });
            }
        );

    } catch (err) {
        console.error(err);
        res.status(400).send('Google Auth Error');
    }
});

module.exports = router;
