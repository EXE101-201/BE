import mongoose from 'mongoose';
import Confession from '../models/Confession.js';
import { containsBadWords } from '../utils/badWords.js';

export const createConfession = async (req, res) => {
    try {
        const { content, tags, anonymous } = req.body;

        // Safety check
        if (containsBadWords(content)) {
            return res.status(400).json({ message: 'Nội dung chứa từ ngữ không phù hợp' });
        }

        // Process tags: lowercase, unique, limit to 5
        let processedTags = [];
        if (tags && Array.isArray(tags)) {
            processedTags = tags
                .map(tag => tag.toLowerCase().trim())
                .filter((tag, index, arr) => arr.indexOf(tag) === index)
                .slice(0, 5);
        }

        // Set author based on anonymous flag
        const author = anonymous ? null : (req.user ? req.user._id : null);

        const newConfession = new Confession({
            content,
            tags: processedTags,
            author: author,
            status: 'approved'
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
        let match = { status: 'approved' };
        if (tag) {
            match.tags = tag;
        }
        console.log('Fetching approved confessions with match:', match);
        const confessions = await Confession.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    authorName: {
                        $cond: {
                            if: { $or: [{ $eq: ['$author', null] }, { $eq: [{ $size: '$user' }, 0] }] },
                            then: 'Anonymous',
                            else: { $arrayElemAt: ['$user.fullName', 0] }
                        }
                    },
                    authorId: {
                        $cond: {
                            if: { $or: [{ $eq: ['$author', null] }, { $eq: [{ $size: '$user' }, 0] }] },
                            then: null,
                            else: { $arrayElemAt: ['$user._id', 0] }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'confession',
                    as: 'comments'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: '$comments' }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    tags: 1,
                    reactions: {
                        $arrayToObject: {
                            $map: {
                                input: { $objectToArray: { $ifNull: ['$reactions', {}] } },
                                as: 'item',
                                in: {
                                    k: '$$item.k',
                                    v: {
                                        $cond: {
                                            if: { $isArray: '$$item.v' },
                                            then: { $size: '$$item.v' },
                                            else: { $ifNull: ['$$item.v', 0] }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    isPremium: 1,
                    createdAt: 1,
                    author: '$authorName',
                    authorId: 1,
                    commentCount: 1,
                    id: '$_id'
                }
            },
            { $sort: { isPremium: -1, createdAt: -1 } }
        ]);
        console.log(`Found ${confessions.length} confessions`);
        res.json(confessions);
    } catch (error) {
        console.error('Error in getApprovedConfessions:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

export const getConfessionById = async (req, res) => {
    try {
        const { id } = req.params;

        const confessions = await Confession.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    authorName: {
                        $cond: {
                            if: { $or: [{ $eq: ['$author', null] }, { $eq: [{ $size: '$user' }, 0] }] },
                            then: 'Anonymous',
                            else: { $arrayElemAt: ['$user.fullName', 0] }
                        }
                    },
                    authorId: {
                        $cond: {
                            if: { $or: [{ $eq: ['$author', null] }, { $eq: [{ $size: '$user' }, 0] }] },
                            then: null,
                            else: { $arrayElemAt: ['$user._id', 0] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    tags: 1,
                    reactions: {
                        $arrayToObject: {
                            $map: {
                                input: { $objectToArray: { $ifNull: ['$reactions', {}] } },
                                as: 'item',
                                in: {
                                    k: '$$item.k',
                                    v: {
                                        $cond: {
                                            if: { $isArray: '$$item.v' },
                                            then: { $size: '$$item.v' },
                                            else: { $ifNull: ['$$item.v', 0] }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    isPremium: 1,
                    createdAt: 1,
                    author: '$authorName',
                    authorId: 1,
                    id: '$_id'
                }
            }
        ]);

        if (!confessions || confessions.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }

        const confession = confessions[0];

        // Get comments
        const Comment = (await import('../models/Comment.js')).default;
        const comments = await Comment.find({ confession: id, status: 'active' }).populate('user', 'fullName').sort({ createdAt: -1 });

        res.json({ ...confession, comments });
    } catch (error) {
        console.error('Error getting confession detail:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const confession = await Confession.findById(id);
        if (!confession) return res.status(404).json({ message: 'Không tìm thấy confession' });

        if (!confession.reactions.has(emoji)) {
            confession.reactions.set(emoji, []);
        }

        let reactionArray = confession.reactions.get(emoji);
        if (!Array.isArray(reactionArray)) {
            reactionArray = [];
        }
        const index = reactionArray.findIndex(id => id.toString() === userId.toString());

        if (index > -1) {
            // Remove reaction (toggle)
            reactionArray.splice(index, 1);
        } else {
            // Add reaction
            reactionArray.push(userId);
        }

        confession.reactions.set(emoji, reactionArray);
        await confession.save();

        // Convert Map to plain object with counts for response
        const counts = {};
        for (let [key, value] of confession.reactions) {
            counts[key] = value.length;
        }

        res.json({ message: index > -1 ? 'Reaction removed' : 'Reaction added', reactions: counts });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const deleteConfession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const confession = await Confession.findById(id);
        if (!confession) {
            return res.status(404).json({ message: 'Confession không tồn tại' });
        }

        if (!confession.author || confession.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Không có quyền xóa confession này' });
        }

        await Confession.findByIdAndDelete(id);
        res.json({ message: 'Xóa confession thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
