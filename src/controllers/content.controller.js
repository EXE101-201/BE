import Content from '../models/Content.js';
import User from '../models/User.js';

export const getAllContent = async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};

        if (type) {
            query.type = type.toUpperCase();
        }

        const contents = await Content.find(query).sort({ createdAt: -1 });

        // Hide contentUrl for premium content if user is not premium (optional UI optimization)
        const user = await User.findById(req.user._id);
        const isPremiumUser = user.isPremium && (new Date(user.premiumUntil) > new Date());

        const sanitizedContents = contents.map(item => {
            const doc = item.toObject();
            if (doc.isPremium && !isPremiumUser) {
                delete doc.contentUrl;
            }
            return doc;
        });

        res.json(sanitizedContents);
    } catch (error) {
        console.log(`Lỗi server khi lấy dữ liệu: ${error}`);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu' });
    }
};

export const getContentById = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ message: 'Không tìm thấy nội dung' });
        }
        const user = await User.findById(req.user._id);
        if (content.isPremium) {
            const isPremiumUser = user.isPremium && (new Date(user.premiumUntil) > new Date());
            if (!isPremiumUser) {
                return res.status(403).json({ message: 'Nội dung này yêu cầu tài khoản Premium' });
            }
        }

        res.json(content);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const createContent = async (req, res) => {
    try {
        const newContent = new Content(req.body);
        await newContent.save();
        res.status(201).json(newContent);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
};

export const incrementViewCount = async (req, res) => {
    try {
        await Content.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
        res.status(200).json({ message: 'View count incremented' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
