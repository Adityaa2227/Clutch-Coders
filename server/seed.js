const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Service = require('./models/Service');
const Pass = require('./models/Pass');
const Transaction = require('./models/Transaction');
const UsageLog = require('./models/UsageLog');
const bcrypt = require('bcryptjs');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected for Seeding'));

const seed = async () => {
    try {
        await User.deleteMany({});
        await Service.deleteMany({});
        await Pass.deleteMany({});
        await Transaction.deleteMany({});
        await UsageLog.deleteMany({});

        // Create Admin
        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('password123', salt);
        const admin = new User({
            name: 'FlexPass Admin',
            email: 'admin@flexpass.com',
            password: adminHash,
            role: 'admin',
            walletBalance: 1000
        });
        await admin.save();

        // Create User
        const userHash = await bcrypt.hash('password123', salt);
        const user = new User({
            name: 'John Doe',
            email: 'user@flexpass.com',
            password: userHash,
            role: 'user',
            walletBalance: 0
        });
        await user.save();

        // Create Services
        const services = [
            {
                name: "OCR Text Extractor API",
                description: "Extract text from images instantaneously. 99% accuracy.",
                type: "usage",
                costPerUnit: 5,
                unitName: "requests",
                creatorId: admin._id
            },
            {
                name: "Premium Video Transcoder",
                description: "Convert video formats in the cloud. Access per hour.",
                type: "time",
                costPerUnit: 50,
                unitName: "hours",
                creatorId: admin._id
            },
            {
                name: "Background Remover AI",
                description: "Remove backgrounds from product images.",
                type: "usage",
                costPerUnit: 15,
                unitName: "images",
                creatorId: admin._id
            }
        ];

        await Service.insertMany(services);

        console.log('Seeding Complete!');
        console.log('Admin: admin@flexpass.com / password123');
        console.log('User: user@flexpass.com / password123');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
