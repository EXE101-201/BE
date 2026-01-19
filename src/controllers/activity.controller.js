import Activity from '../models/Activity.js';

export const logActivity = async (req, res) => {
    try {
        const { type, value } = req.body;
        const activity = new Activity({
            userId: req.user._id,
            type,
            value: value || 1
        });
        await activity.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Log Activity Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
