const mongoose = require('mongoose');

const BlocklistSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['IP', 'EMAIL', 'USER_ID'],
        required: true
    },
    value: {
        type: String, // The actual IP or Email or ID
        required: true,
        unique: true
    },
    reason: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expiresAt: {
        type: Date // Optional auto-expiry
    }
}, { timestamps: true });

module.exports = mongoose.model('Blocklist', BlocklistSchema);
