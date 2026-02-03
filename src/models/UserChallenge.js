import mongoose from 'mongoose';

const userChallengeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
    },
    status: {
        type: String,
        enum: ['JOINED', 'COMPLETED'],
        default: 'JOINED',
    },
    progress: {
        type: Number,
        default: 0, // Number of days completed
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    history: [
        {
            date: { type: Date, default: Date.now },
            completed: { type: Boolean, default: true }
        }
    ]
});

const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);

export default UserChallenge;
