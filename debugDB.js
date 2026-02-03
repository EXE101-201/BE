import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';

const debugDB = async () => {
    try {
        console.log('Starting DB debug...');
        console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
        await connectDB();
        console.log('Connected. Listing collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const count = await mongoose.connection.db.collection('challenges').countDocuments();
        console.log('Challenges count:', count);

        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
};

debugDB();
