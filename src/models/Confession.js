import mongoose from 'mongoose';

const confessionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
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
        of: Number,
        default: {},
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
