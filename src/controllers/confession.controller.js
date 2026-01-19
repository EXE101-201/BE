import Confession from '../models/Confession.js';

export const createConfession = async (req, res) => {
    try {
        const { content } = req.body;
        const newConfession = new Confession({
            content,
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
        const confessions = await Confession.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.json(confessions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getConfessionById = async (req, res) => {
    try {
        const confession = await Confession.findById(req.params.id);
        if (!confession) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        res.json(confession);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
