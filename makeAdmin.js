const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./backend/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kalaconnect';

const makeAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const email = 'namasriramulu85@gmail.com';
        const user = await User.findOneAndUpdate({ email: email }, { role: 'admin' }, { new: true });
        if (user) {
            console.log(`Successfully made ${email} an admin! Role: ${user.role}`);
        } else {
            console.log(`User ${email} not found.`);
        }
    } catch (err) {
        console.error("Error updating user:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

makeAdmin();
