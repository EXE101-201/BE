import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true, // Number of days
    },
    icon: {
        type: String, // Path to image (e.g., /Thuthach1.png)
    },
    participants: {
        type: Number,
        default: 0,
    },
    completedCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
