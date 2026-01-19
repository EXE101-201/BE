import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['AI_CHAT', 'LOGIN', 'USAGE_TIME'],
        required: true,
    },
    value: {
        type: Number,
        default: 1, // e.g., minutes for USAGE_TIME, or just 1 for count
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
