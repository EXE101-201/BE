import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    confession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Confession',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    isReported: {
        type: Boolean,
        default: false,
    },
    reports: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'deleted', 'hidden'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
