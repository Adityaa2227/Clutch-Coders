const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Payment', 'Account', 'Technical', 'Pass', 'Other'],
        default: 'Other'
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    attachment: {
        type: String, 
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Auto-update lastMessageAt on save
// Auto-update lastMessageAt on save
TicketSchema.pre('save', async function() {
    if (this.isModified('status') || this.isNew) {
        this.lastMessageAt = Date.now();
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);
