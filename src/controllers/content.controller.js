import Content from '../models/Content.js';
import User from '../models/User.js';
import Article from '../models/Article.js';

export const getAllContent = async (req, res) => {
    try {
        const { type, page = 1, limit = 6 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        let query = {};
        if (type) {
            query.type = type.toUpperCase();
        }

        const [contents, total] = await Promise.all([
            Content.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Content.countDocuments(query),
        ]);

        // Get all articles in one query (thumbnail + title + _id only)
        const allArticles = await Article.find({}, { title: 1, thumbnail: 1 });
        // Build maps for fast lookup
        const articleByIdMap = {};
        const articleByTitleMap = {};
        allArticles.forEach(a => {
            articleByIdMap[a._id.toString()] = a;
            if (a.title) articleByTitleMap[a.title.trim().toLowerCase()] = a;
        });

        // Hide contentUrl for premium content if user is not premium
        const user = await User.findById(req.user._id);
        const isPremiumUser = user.isPremium && (new Date(user.premiumUntil) > new Date());

        // Nếu là ARTICLE: lấy thumbnail từ Article liên kết (1 query duy nhất, tránh N+1)
        let articleThumbnailMap = {};
        if (query.type === 'ARTICLE') {
            const articleIds = contents.map(item =>
                item.idArticle?._id
                    ? item.idArticle._id.toString()
                    : item.idArticle?.toString().replace(/.*'(.+)'.*/, '$1')
            );
            console.log(articleIds);
            if (articleIds.length > 0) {
                const articles = await Article.find(
                    { _id: { $in: articleIds } },
                    { _id: 1, thumbnail: 1 }
                );
                articles.forEach(a => {
                    articleThumbnailMap[a._id.toString()] = a.thumbnail;
                });
            }
        }

        const data = contents.map(item => {
            const doc = item.toObject();

            // Fallback 1: Use linked article's thumbnail via idArticle
            if (!doc.thumbnail && doc.idArticle?.type) {
                const linked = articleByIdMap[doc.idArticle.type.toString()];
                if (linked?.thumbnail) doc.thumbnail = linked.thumbnail;
            }
            // Fallback 2: Match by title similarity
            if (!doc.thumbnail && doc.title) {
                const key = doc.title.trim().toLowerCase();
                const matched = articleByTitleMap[key];
                if (matched?.thumbnail) doc.thumbnail = matched.thumbnail;
            }

            if (doc.isPremium && !isPremiumUser) {
                delete doc.contentUrl;
            }
            // Nếu là ARTICLE và chưa có thumbnail, lấy từ Article liên kết
            if (doc.type === 'ARTICLE') {
                const articleId = doc.idArticle?.toString();
                if (articleId && articleThumbnailMap[articleId]) {
                    doc.thumbnail = doc.thumbnail || articleThumbnailMap[articleId];
                }
            }
            return doc;
        });

        res.json({
            data,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        });
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
