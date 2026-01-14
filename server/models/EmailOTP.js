const mongoose = require('mongoose');

const emailOTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // One active OTP record per email
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    requestCount: {
        type: Number,
        default: 1
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Auto-delete document after 1 hour (Hard limit for rate limiting context)
    }
});

module.exports = mongoose.model('EmailOTP', emailOTPSchema);
