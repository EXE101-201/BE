import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.js';
import mongoose from 'mongoose';

async function checkUser() {
    try {
        await connectDB();
        const email = 'wintered012@gmail.com';
        const user = await User.findOne({ email });
        if (user) {
            console.log(`User found: ${user.email} (Role: ${user.role})`);
        } else {
            console.log(`User NOT found: ${email}`);
            const allUsers = await User.find({}, 'email').limit(5);
            console.log('Sample users in DB:', allUsers.map(u => u.email));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

checkUser();
