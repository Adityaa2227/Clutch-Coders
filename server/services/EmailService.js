const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const templates = require('./emailTemplates');

class EmailService {
    constructor() {
        // Init transporter
        // Ideally use env vars. For Hackathon/Demo, we can use Ethereal (preview) or Gmail app password if provided.
        // Fallback to console if no creds.
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // Use SSL
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            this.mode = 'LIVE';
        } else {
            // Ethereal Test Account
            this.mode = 'TEST';
            nodemailer.createTestAccount().then(testAccount => {
                this.transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false, 
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass, 
                    },
                });
                console.log('📧 EmailService: Running in TEST mode (Ethereal).');
            });
        }
    }

    async logEmail(recipient, subject, type, status, metadata = {}, error = null) {
        try {
            await EmailLog.create({
                recipient,
                subject,
                type,
                status,
                metadata,
                errorMessage: error ? error.message : null
            });
        } catch (err) {
            console.error('EmailLog Error:', err);
        }
    }

    async sendEmail(to, subject, htmlContent, type, metadata = {}) {
        if (!to) return;
        
        try {
            // Ethereal check if not ready
            if (!this.transporter && this.mode === 'TEST') {
                console.log(`[Email Pending] To: ${to} Subject: ${subject}`);
                return; 
            }

            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"FlexPass Notifications" <no-reply@flexpass.com>',
                to,
                subject,
                html: htmlContent
            });

            if (this.mode === 'TEST') {
                console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
                // console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
            }

            await this.logEmail(to, subject, type, 'SENT', metadata);
            return true;

        } catch (error) {
            console.error('Email Send Error:', error);
            await this.logEmail(to, subject, type, 'FAILED', metadata, error);
            return false;
        }
    }

    // --- Public Methods ---

    async sendTransactionReceipt(user, transaction, passName = null) {
        if (!user || !user.email) return;
        const html = templates.paymentReceipt({
            name: user.name,
            amount: transaction.amount,
            transactionId: transaction._id,
            type: transaction.type,
            passName: passName
        });
        await this.sendEmail(user.email, 'Payment Receipt - FlexPass', html, 'PAYMENT', { receiptId: transaction._id });
    }

    async sendExpiryWarning(user, pass) {
        if (!user || !user.email) return;
        const html = templates.expiryWarning({
            passName: pass.serviceId.name,
            type: pass.serviceId.type,
            expiresAt: pass.expiresAt,
            remainingAmount: pass.remainingAmount
        });
        await this.sendEmail(user.email, '⚠️ Action Required: Pass Expiring', html, 'EXPIRY_WARNING', { passId: pass._id });
    }

    async sendExpiredNotice(user, pass) {
        if (!user || !user.email) return;
        const html = templates.passExpired({
            passName: pass.serviceId.name
        });
        await this.sendEmail(user.email, 'Your Pass Has Expired', html, 'EXPIRED', { passId: pass._id });
    }

    async sendRewardNotification(user, amount, reason) {
        if (!user || !user.email) return;
        const html = templates.rewardEarned({
            name: user.name,
            amount,
            reason
        });
        await this.sendEmail(user.email, 'Start Spending! You earned a reward', html, 'REWARD', { amount });
    }

    async sendSupportTicketUpdate(user, ticket, message) {
        if (!user || !user.email) return;
        const html = templates.supportTicket({
            ticketId: ticket._id,
            message
        });
        await this.sendEmail(user.email, `Update on Ticket #${ticket._id.toString().slice(-6)}`, html, 'SUPPORT', { ticketId: ticket._id });
    }

    async sendOTP(email, otp) {
        const html = templates.otpVerification({ otp });
        // Priority email
        await this.sendEmail(email, 'Flex – Verify Your Email', html, 'SYSTEM', { otpFlow: true });
    }
    
    async sendManualAdminMessage(userEmail, subject, message) {
        const html = templates.manualMessage({ subject, message });
        return await this.sendEmail(userEmail, subject, html, 'SYSTEM', { manual: true });
    }
}

module.exports = new EmailService();
