import mongoose from 'mongoose';

const confessionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 500, // Limit content length
    },
    tags: [{
        type: String,
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Can be anonymous
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    reactions: {
        type: Map,
        of: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        default: {},
    },
    isPremium: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Confession = mongoose.model('Confession', confessionSchema);

export default Confession;
