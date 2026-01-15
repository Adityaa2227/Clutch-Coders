const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FAQ = require('./models/FAQ');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    family: 4,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const faqs = [
    {
        question: "How do I add money to my wallet?",
        answer: "Go to your Dashboard, click on the wallet balance, and select 'Top Up'. You can use various payment methods including UPI and cards.",
        category: "Payment"
    },
    {
        question: "What happens if my pass expires?",
        answer: "When your pass expires, you will need to purchase a new one to continue accessing the service. You can view your pass status in the Dashboard.",
        category: "Pass"
    },
    {
        question: "How does the referral system work?",
        answer: "Share your unique referral code found in the Rewards tab. When a friend signs up using your code, you get ₹5 and they get ₹2.5!",
        category: "Referral"
    },
    {
        question: "Can I cancel a subscription?",
        answer: "FlexPass uses a micro-subscription model (hourly/daily/weekly passes). These are non-refundable once activated. However, they do not auto-renew, so you are never charged automatically.",
        category: "Account"
    },
    {
        question: "Why is my account blocked?",
        answer: "Accounts may be blocked for suspicious activity or violation of terms. Please raise a support ticket under 'Account' for review.",
        category: "Account"
    }
];

const seedDB = async () => {
    try {
        await FAQ.deleteMany({});
        await FAQ.insertMany(faqs);
        console.log('FAQs Seeded');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();
