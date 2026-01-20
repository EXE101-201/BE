import Confession from '../models/Confession.js';
import { containsBadWords } from '../utils/badWords.js';

export const createConfession = async (req, res) => {
    try {
        const { content, tags } = req.body;

        // Safety check
        if (containsBadWords(content)) {
            return res.status(400).json({ message: 'Nội dung chứa từ ngữ không phù hợp' });
        }

        // Validate tags
        const validTags = ['stress', 'học_tập', 'mối_quan_hệ', 'gia_đình'];
        if (tags && tags.some(tag => !validTags.includes(tag))) {
            return res.status(400).json({ message: 'Tag không hợp lệ' });
        }

        const newConfession = new Confession({
            content,
            tags: tags || [],
            author: req.user?._id || null
        });
        await newConfession.save();
        res.status(201).json({ message: 'Gửi confession thành công, đang chờ duyệt', confession: newConfession });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getApprovedConfessions = async (req, res) => {
    try {
        const { tag } = req.query;
        let query = { status: 'approved' };
        if (tag) {
            query.tags = tag;
        }
        const confessions = await Confession.find(query).sort({ createdAt: -1 });
        res.json(confessions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getConfessionById = async (req, res) => {
    try {
        const confession = await Confession.findById(req.params.id).populate('author', 'username');
        if (!confession) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

        // Get comments
        const Comment = (await import('../models/Comment.js')).default;
        const comments = await Comment.find({ confession: req.params.id, status: 'active' }).populate('user', 'username').sort({ createdAt: -1 });

        res.json({ ...confession.toObject(), comments });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body; // e.g., '❤️', '🤍'

        const confession = await Confession.findById(id);
        if (!confession) return res.status(404).json({ message: 'Không tìm thấy confession' });

        if (!confession.reactions.has(emoji)) {
            confession.reactions.set(emoji, 0);
        }
        confession.reactions.set(emoji, confession.reactions.get(emoji) + 1);

        await confession.save();
        res.json({ message: 'Reaction added', reactions: confession.reactions });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
