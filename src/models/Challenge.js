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
    contentDetail: [String],
    participants: {
        type: Number,
        default: 0,
    },
    time: {
        type: Number,
        default: 900,
    },
    type: {
        type: Number,
        default: 1,
    },
    completedCount: {
        type: Number,
        default: 0,
    },
    contentText: [{
        icon: String,
        title: String,
        detail: [{
            icon: String,
            text: String
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
