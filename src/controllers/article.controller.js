import Article from '../models/Article.js';


export const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        console.log(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết bài viết' });
    }
};

export const createArticle = async (req, res) => {
    try {
        const newArticle = new Article(req.body);
        await newArticle.save();
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
    }
};
