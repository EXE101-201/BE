import User from '../models/User.js';
import Confession from '../models/Confession.js';
import Activity from '../models/Activity.js';
import Comment from '../models/Comment.js';
import ChatScript from '../models/ChatScript.js';
import Transaction from '../models/Transaction.js';
import Blacklist from '../models/Blacklist.js';
import Content from '../models/Content.js';

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. DAU (Users with any activity today)
        const dau = await Activity.distinct('userId', {
            createdAt: { $gte: today }
        });

        // 2. Confessions today
        const confessionsToday = await Confession.countDocuments({
            createdAt: { $gte: today }
        });

        // 3. AI Chat count today
        const aiChatsToday = await Activity.countDocuments({
            type: 'AI_CHAT',
            createdAt: { $gte: today }
        });

        // 4. Average Usage Time (simplified for MVP)
        const usageActivities = await Activity.find({
            type: 'USAGE_TIME',
            createdAt: { $gte: today }
        });
        const totalUsage = usageActivities.reduce((acc, curr) => acc + curr.value, 0);
        const avgUsage = usageActivities.length > 0 ? totalUsage / usageActivities.length : 0;

        // 5. Free vs Premium Distribution
        const freeCount = await User.countDocuments({ isPremium: false });
        const premiumCount = await User.countDocuments({ isPremium: true });

        // Additional data for charts (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await Confession.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });
            last7Days.push({
                date: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                count
            });
        }

        res.json({
            dau: dau.length,
            confessionsToday,
            aiChatsToday,
            avgUsage: Math.round(avgUsage),
            distribution: {
                free: freeCount,
                premium: premiumCount
            },
            confessionTrend: last7Days
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
};

export const getPendingConfessions = async (req, res) => {
    try {
        const pending = await Confession.find({ status: 'pending' }).populate('author', 'fullName email');
        res.json(pending);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const moderateConfession = async (req, res) => {
    try {
        const { id, status } = req.body;
        const confession = await Confession.findByIdAndUpdate(id, { status }, { new: true });
        res.json({ message: 'Đã cập nhật trạng thái confession', confession });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 3. Quản lý Bình luận
export const getReportedComments = async (req, res) => {
    try {
        const comments = await Comment.find({ isReported: true })
            .populate('user', 'fullName email')
            .populate('confession', 'content');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy bình luận bị báo cáo' });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        await Comment.findByIdAndUpdate(id, { status: 'deleted' });
        res.json({ message: 'Đã xóa bình luận' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa bình luận' });
    }
};

export const getBlacklist = async (req, res) => {
    try {
        const keywords = await Blacklist.find().populate('addedBy', 'fullName');
        res.json(keywords);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách từ khóa' });
    }
};

export const addBlacklistKeyword = async (req, res) => {
    try {
        const { keyword } = req.body;
        const newKeyword = await Blacklist.create({ keyword, addedBy: req.user._id });
        res.status(201).json(newKeyword);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server hoặc từ khóa đã tồn tại' });
    }
};

export const deleteBlacklistKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        await Blacklist.findByIdAndDelete(id);
        res.json({ message: 'Đã xóa từ khóa khỏi danh sách đen' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 4. Quản lý Chatbot
export const getChatScripts = async (req, res) => {
    try {
        const scripts = await ChatScript.find();
        res.json(scripts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const upsertChatScript = async (req, res) => {
    try {
        const { id, topic, description, steps, isActive } = req.body;
        if (id) {
            const script = await ChatScript.findByIdAndUpdate(id, { topic, description, steps, isActive }, { new: true });
            res.json(script);
        } else {
            const script = await ChatScript.create({ topic, description, steps, isActive });
            res.status(201).json(script);
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lưu kịch bản chat' });
    }
};

// 5. Quản lý Nội dung
export const getAllContentAdmin = async (req, res) => {
    try {
        const content = await Content.find().sort('-createdAt');
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const createContent = async (req, res) => {
    try {
        const newContent = await Content.create(req.body);
        res.status(201).json(newContent);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo nội dung' });
    }
};

export const updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Content.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật nội dung' });
    }
};

export const deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        await Content.findByIdAndDelete(id);
        res.json({ message: 'Đã xóa nội dung' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 6. Quản lý Gói Premium
export const getPremiumUsers = async (req, res) => {
    try {
        const users = await User.find({ isPremium: true }).select('fullName email premiumUntil createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getRevenueStats = async (req, res) => {
    try {
        const revenue = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);
        res.json(revenue);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tính doanh thu' });
    }
};
