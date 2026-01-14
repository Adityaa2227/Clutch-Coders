const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String // Store HTML content for internal viewing
    },
    type: {
        type: String,
        enum: ['PAYMENT', 'EXPIRY_WARNING', 'EXPIRED', 'REWARD', 'REFERRAL', 'SUPPORT', 'SYSTEM'],
        required: true
    },
    status: {
        type: String,
        enum: ['SENT', 'FAILED'],
        default: 'SENT'
    },
    metadata: {
        type: Object,
        default: {}
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
