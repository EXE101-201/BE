import mongoose from 'mongoose';
import './Article.js';

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['ARTICLE', 'MUSIC', 'MEDITATION'],
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    summary: {
        type: String, // For articles describes content, for audio describes track
        trim: true,
    },
    duration: {
        type: String, // e.g., "10:00" - mainly for audio/video
    },
    isPremium: {
        type: Boolean,
        default: false,
    },
    thumbnail: {
        type: String, // URL to image
    },
    idArticle: {
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    },
    contentUrl: {
        type: String, // URL to potential actual content (audio file, full article text, etc.)
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    viewCount: {
        type: Number,
        default: 0,
    }
});

const Content = mongoose.model('Content', contentSchema);

export default Content;
