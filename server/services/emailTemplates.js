const getBaseStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #f4f7fa; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 32px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
    .content { padding: 40px 32px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .amount { font-size: 32px; font-weight: 800; color: #0f172a; margin: 16px 0; letter-spacing: -1px; }
    .highlight { color: #2563eb; font-weight: 600; }
    .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .receipt-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .receipt-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #0f172a; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 24px; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
`;

const wrapTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="#" class="logo">FlexPass</a>
        </div>
        <div class="content">
            <h1 class="title">${title}</h1>
            ${bodyContent}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} FlexPass Inc. <br>
            Secure, Usage-Based, Decentralized Access.
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    paymentReceipt: (data) => wrapTemplate(
        `Payment Receipt`, 
        `
        <p class="text">Hi ${data.name},</p>
        <p class="text">We received your payment. Thanks for using FlexPass!</p>
        <div class="amount">₹${parseFloat(data.amount).toFixed(2)}</div>
        <div class="receipt-box">
            <div class="receipt-row">
                <span class="label">Date</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="receipt-row">
                <span class="label">Transaction ID</span>
                <span class="value">${data.transactionId}</span>
            </div>
            <div class="receipt-row">
                <span class="label">Type</span>
                <span class="value">${data.type}</span>
            </div>
            ${data.passName ? `
            <div class="receipt-row">
                <span class="label">Item</span>
                <span class="value">${data.passName}</span>
            </div>` : ''}
        </div>
        <a href="http://localhost:5173/history" class="btn">View Transaction</a>
        `
    ),

    expiryWarning: (data) => wrapTemplate(
        `⚠️ Service Pass Expiring Soon`,
        `
        <p class="text">Your pass for <span class="highlight">${data.passName}</span> is running low.</p>
        <div class="receipt-box">
            ${data.type === 'time' ? `
            <div class="receipt-row">
                <span class="label">Expires At</span>
                <span class="value">${new Date(data.expiresAt).toLocaleString()}</span>
            </div>
            ` : `
            <div class="receipt-row">
                <span class="label">Remaining Requests</span>
                <span class="value">${data.remainingAmount}</span>
            </div>
            `}
        </div>
        <p class="text">Renew now to avoid interruption.</p>
        <a href="http://localhost:5173/services" class="btn">Renew Pass</a>
        `
    ),

    passExpired: (data) => wrapTemplate(
        `Pass Expired`,
        `
        <p class="text">Your access to <span class="highlight">${data.passName}</span> has expired.</p>
        <p class="text">We hope you enjoyed the service. You can purchase a new pass anytime from the marketplace.</p>
        <a href="http://localhost:5173/services" class="btn">Marketplace</a>
        `
    ),

    rewardEarned: (data) => wrapTemplate(
        `🎉 You Earned a Reward!`,
        `
        <p class="text">Great news, ${data.name}!</p>
        <p class="text">You just earned a reward for <span class="highlight">${data.reason}</span>.</p>
        <div class="amount">₹${parseFloat(data.amount).toFixed(2)}</div>
        <p class="text">This has been added to your wallet balance.</p>
        <a href="http://localhost:5173/rewards" class="btn">Check Rewards</a>
        `
    ),

    supportTicket: (data) => wrapTemplate(
        `Support Ticket Update`,
        `
        <p class="text">Update on Ticket #${data.ticketId}</p>
        <div class="receipt-box">
            <p class="text" style="font-style: italic;">"${data.message}"</p>
        </div>
        <a href="http://localhost:5173/support" class="btn">Reply to Ticket</a>
        `
    ),

    otpVerification: (data) => wrapTemplate(
        `Verify Your Email`,
        `
        <p class="text">Hi there,</p>
        <p class="text">Use the code below to verify your email and complete your signup.</p>
        <div style="background: #f1f5f9; padding: 24px; text-align: center; border-radius: 12px; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${data.otp}</span>
        </div>
        <p class="text">This code expires in 10 minutes.</p>
        <p class="text" style="font-size: 12px; color: #94a3b8;">If you didn't request this, please ignore it.</p>
        `
    ),
    
    manualMessage: (data) => wrapTemplate(
        `${data.subject}`,
        `
        <p class="text">${data.message}</p>
        `
    )
};
