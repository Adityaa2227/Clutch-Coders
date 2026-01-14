/**
 * @fileoverview Support System Routes
 * @description Handles Ticket CRUD, Message threading, and Admin status updates.
 * @path server/routes/support.js
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const EmailService = require('../services/EmailService');

// --- FAQ ROUTES ---
// @route   GET api/support/faqs
// @desc    Get all published FAQs
// @access  Public
router.get('/faqs', async (req, res) => {
    try {
        const faqs = await FAQ.find({ isPublished: true }).sort({ category: 1 });
        res.json(faqs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/support/faqs
// @desc    Create FAQ (Admin)
// @access  Private (Admin)
router.post('/faqs', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const faq = new FAQ(req.body);
        await faq.save();
        res.json(faq);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// --- TICKET ROUTES ---

// @route   POST api/support/tickets
// @desc    Create a new support ticket
// @access  Private
router.post('/tickets', auth, async (req, res) => {
    try {
        const { subject, category, description, priority } = req.body;
        
        const ticket = new Ticket({
            user: req.user.id,
            subject,
            category,
            description,
            priority: priority || 'low'
        });

        await ticket.save();

        // Emit Socket Event for Admin
        if (req.app.get('io')) {
            const io = req.app.get('io');
            const user = await User.findById(req.user.id).select('name');
            io.to('admin_notifications').emit('new_ticket', {
                ticket: ticket,
                user: user
            });
        }

        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/support/tickets
// @desc    Get tickets (User: Own, Admin: All)
// @access  Private
router.get('/tickets', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        let tickets;
        if (user.role === 'admin') {
            const { status } = req.query;
            const query = status ? { status } : {};
            tickets = await Ticket.find(query)
                .populate('user', 'name email')
                .sort({ lastMessageAt: -1 });
        } else {
            tickets = await Ticket.find({ user: req.user.id }).sort({ lastMessageAt: -1 });
        }
        res.json(tickets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/support/tickets/:id
// @desc    Get single ticket details and messages
// @access  Private
router.get('/tickets/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const ticket = await Ticket.findById(req.params.id).populate('user', 'name email');
        
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        // Access Check
        if (user.role !== 'admin' && ticket.user._id.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const messages = await TicketMessage.find({ ticket: req.params.id })
            .populate('sender', 'name role')
            .sort({ createdAt: 1 });

        res.json({ ticket, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST api/support/tickets/:id/messages
// @desc    Send a message on a ticket
// @access  Private
router.post('/tickets/:id/messages', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        // Access Check
        if (user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { text, isAdminNote } = req.body;

        const message = new TicketMessage({
            ticket: req.params.id,
            sender: req.user.id,
            text,
            isAdminNote: isAdminNote && user.role === 'admin'
        });

        await message.save();

        // Update ticket timestamp
        ticket.lastMessageAt = Date.now();
        if (user.role === 'admin' && ticket.status === 'open') {
             ticket.status = 'in_progress';
        }
        await ticket.save();

        const fullMessage = await TicketMessage.findById(message._id).populate('sender', 'name role');

        // Socket Emission
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`ticket_${req.params.id}`).emit('receive_message', fullMessage);
            
            if (user.role !== 'admin') {
                 io.to('admin_notifications').emit('ticket_reply', { ticketId: ticket._id, user: user.name });
            } else {
                 // Admin replied, notify user via email
                 const ticketUser = await User.findById(ticket.user); // Fetch original ticket creator
                 await EmailService.sendSupportTicketUpdate(ticketUser, ticket, text);
            }
        }

        res.json(fullMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PUT api/support/tickets/:id/status
// @desc    Update ticket status (Admin)
// @access  Private (Admin)
router.put('/tickets/:id/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        
        // Notify via Socket
        if (req.app.get('io')) {
             const io = req.app.get('io');
             io.to(`ticket_${req.params.id}`).emit('ticket_status_change', { status });
        }

        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
