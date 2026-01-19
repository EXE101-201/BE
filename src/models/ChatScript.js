import mongoose from 'mongoose';

const chatScriptSchema = new mongoose.Schema({
    topic: {
        type: String, // e.g., "Stress học tập", "Mất động lực", "Mất ngủ"
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    steps: [{
        role: { type: String, enum: ['system', 'assistant', 'user'] },
        content: String,
    }],
    usageCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const ChatScript = mongoose.model('ChatScript', chatScriptSchema);

export default ChatScript;
