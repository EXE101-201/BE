import Comment from '../models/Comment.js';
import Confession from '../models/Confession.js';
import { containsBadWords } from '../utils/badWords.js';

// Get comments for a confession
export const getComments = async (req, res) => {
    try {
        const { confessionId } = req.params;
        const comments = await Comment.find({ confession: confessionId, status: 'active' }).populate('user', 'fullName').sort({ createdAt: -1 });
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


        const newComment = new Comment({
            confession: confessionId,
            user: req.user._id,
            content,
        });

        await newComment.save();
        await newComment.populate('user', 'fullName');
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({ message: 'Bình luận không tồn tại' });
        }

        // Check if user is comment author
        const isCommentAuthor = comment.user.toString() === req.user._id.toString();

        // Check if user is confession author
        const confession = await Confession.findById(comment.confession);
        let isConfessionAuthor = false;
        if (confession) {
            // Confession uses 'author' field
            if (confession.author && confession.author.toString() === req.user._id.toString()) {
                isConfessionAuthor = true;
            }
        }

        if (!isCommentAuthor && !isConfessionAuthor) {
            return res.status(403).json({ message: 'Không có quyền xóa bình luận này' });
        }

        await Comment.findByIdAndDelete(id);
        res.json({ message: 'Đã xóa bình luận' });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};