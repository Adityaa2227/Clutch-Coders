const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'USER_BLOCK', 
            'USER_UNBLOCK', 
            'USER_SUSPEND', 
            'PASS_REVOKE', 
            'WALLET_LOCK', 
            'WALLET_UNLOCK', 
            'MANUAL_BALANCE_ADJUST',
            'SERVICE_DISABLE',
            'SERVICE_MAINTENANCE',
            'EMAIL_DISABLE',
            'IP_BLOCK',
            'IP_UNBLOCK',
            'SESSION_KILL'
        ]
    },
    targetEntity: {
        type: String, // 'User', 'Service', 'Transaction'
        required: true
    },
    targetId: {
        type: String,
        required: true
    },
    metadata: {
        type: Object, // Store "Before" and "After" values here
        default: {}
    },
    ip: {
        type: String
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    }
}, { timestamps: true });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);
