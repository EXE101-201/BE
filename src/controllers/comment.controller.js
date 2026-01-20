import Comment from '../models/Comment.js';
import Confession from '../models/Confession.js';
import { containsBadWords } from '../utils/badWords.js';

// Get comments for a confession
export const getComments = async (req, res) => {
    try {
        const { confessionId } = req.params;
        const comments = await Comment.find({ confession: confessionId, status: 'active' }).populate('user', 'username').sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Add a comment
export const addComment = async (req, res) => {
    try {
        const { confessionId } = req.params;
        const { content } = req.body;

        // Check if confession exists and is approved
        const confession = await Confession.findById(confessionId);
        if (!confession || confession.status !== 'approved') {
            return res.status(404).json({ message: 'Confession không tồn tại hoặc chưa được duyệt' });
        }

        // Safety check
        if (containsBadWords(content)) {
            return res.status(400).json({ message: 'Nội dung chứa từ ngữ không phù hợp' });
        }

        // For MVP, allow positive comments; in future, add sentiment analysis
        const newComment = new Comment({
            confession: confessionId,
            user: req.user._id,
            content,
        });

        await newComment.save();
        await newComment.populate('user', 'username');
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};