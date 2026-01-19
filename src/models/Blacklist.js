import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Blacklist = mongoose.model('Blacklist', blacklistSchema);

export default Blacklist;
