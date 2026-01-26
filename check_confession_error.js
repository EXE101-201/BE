
import mongoose from 'mongoose';
import Confession from './src/models/Confession.js';
import User from './src/models/User.js';
import Comment from './src/models/Comment.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
        console.log('Connected.');

        console.log('Running aggregation...');
        const confessions = await Confession.aggregate([
            { $match: { status: 'approved' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    author: {
                        $cond: {
                            if: { $eq: ['$author', null] },
                            then: 'Anonymous',
                            else: { $ifNull: [{ $arrayElemAt: ['$user.fullName', 0] }, 'Anonymous'] }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'confession',
                    as: 'comments'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: '$comments' }
                }
            },
            {
                $project: {
                    _id: 0,
                    user: 0,
                    comments: 0,
                    id: '$_id',
                    commentCount: '$commentCount'
                }
            },
            { $sort: { isPremium: -1, createdAt: -1 } }
        ]);
        console.log('Aggregation success!');
        console.log('Found:', confessions.length);
    } catch (error) {
        console.error('Aggregation Failed!');
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
