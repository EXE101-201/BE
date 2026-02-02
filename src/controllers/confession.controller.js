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

        // Always store author if logged in, but use isAnonymous to control visibility
        const author = req.user ? req.user._id : null;
        const isAnonymous = anonymous === true;

        const newConfession = new Confession({
            content,
            tags: processedTags,
            author,
            isAnonymous,
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
                            if: { $or: [{ $eq: ['$isAnonymous', true] }, { $eq: ['$author', null] }, { $eq: [{ $size: '$user' }, 0] }] },
                            then: 'Anonymous',
                            else: { $arrayElemAt: ['$user.fullName', 0] }
                        }
                    },
                    authorId: { $ifNull: ['$author', null] }
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
                    authorId: {
                        $let: {
                            vars: {
                                userId: req.user ? req.user._id : null,
                                role: req.user ? req.user.role : null
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $or: [
                                            { $eq: ['$isAnonymous', false] },
                                            { $eq: ['$$role', 'ADMIN'] },
                                            { $eq: ['$$userId', '$author'] }
                                        ]
                                    },
                                    then: { $ifNull: ['$author', null] },
                                    else: null
                                }
                            }
                        }
                    },
                    isOwner: {
                        $let: {
                            vars: { userId: req.user ? req.user._id.toString() : null },
                            in: {
                                $and: [
                                    { $ne: ['$$userId', null] },
                                    { $eq: ['$$userId', { $toString: '$author' }] }
                                ]
                            }
                        }
                    },
                    commentCount: 1,
                    id: '$_id',
                    myReaction: {
                        $let: {
                            vars: {
                                reactionsArray: { $objectToArray: { $ifNull: ['$reactions', {}] } },
                                userId: req.user ? req.user._id : null
                            },
                            in: {
                                $reduce: {
                                    input: '$$reactionsArray',
                                    initialValue: null,
                                    in: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $isArray: '$$this.v' },
                                                    { $in: ['$$userId', '$$this.v'] }
                                                ]
                                            },
                                            '$$this.k',
                                            '$$value'
                                        ]
                                    }
                                }
                            }
                        }
                    }
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
                            if: { $or: [{ $eq: ['$isAnonymous', true] }, { $eq: ['$author', null] }, { $eq: [{ $size: '$user' }, 0] }] },
                            then: 'Anonymous',
                            else: { $arrayElemAt: ['$user.fullName', 0] }
                        }
                    },
                    authorId: { $ifNull: ['$author', null] }
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
                    authorId: {
                        $let: {
                            vars: {
                                userId: req.user ? req.user._id : null,
                                role: req.user ? req.user.role : null
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $or: [
                                            { $eq: ['$isAnonymous', false] },
                                            { $eq: ['$$role', 'ADMIN'] },
                                            { $eq: ['$$userId', '$author'] }
                                        ]
                                    },
                                    then: { $ifNull: ['$author', null] },
                                    else: null
                                }
                            }
                        }
                    },
                    isOwner: {
                        $let: {
                            vars: { userId: req.user ? req.user._id.toString() : null },
                            in: {
                                $and: [
                                    { $ne: ['$$userId', null] },
                                    { $eq: ['$$userId', { $toString: '$author' }] }
                                ]
                            }
                        }
                    },
                    id: '$_id',
                    myReaction: {
                        $let: {
                            vars: {
                                reactionsArray: { $objectToArray: { $ifNull: ['$reactions', {}] } },
                                userId: req.user ? req.user._id : null
                            },
                            in: {
                                $reduce: {
                                    input: '$$reactionsArray',
                                    initialValue: null,
                                    in: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $isArray: '$$this.v' },
                                                    { $in: ['$$userId', '$$this.v'] }
                                                ]
                                            },
                                            '$$this.k',
                                            '$$value'
                                        ]
                                    }
                                }
                            }
                        }
                    }
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

        if (!confession.reactions || !(confession.reactions instanceof Map)) {
            // If it's a POJO from old data, convert to Map, otherwise new Map
            const initialData = confession.reactions && typeof confession.reactions === 'object' ? Object.entries(confession.reactions) : [];
            confession.reactions = new Map(initialData);
        }

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
        if (confession.reactions instanceof Map) {
            for (let [key, value] of confession.reactions) {
                counts[key] = Array.isArray(value) ? value.length : 0;
            }
        } else if (typeof confession.reactions === 'object' && confession.reactions !== null) {
            for (let key in confession.reactions) {
                counts[key] = Array.isArray(confession.reactions[key]) ? confession.reactions[key].length : 0;
            }
        }

        res.json({ message: index > -1 ? 'Reaction removed' : 'Reaction added', reactions: counts });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getTags = async (req, res) => {
    try {
        const tags = await Confession.distinct('tags', { status: 'approved' });
        res.json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
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

        const isAdmin = req.user.role === 'admin';
        const isAuthor = confession.author && confession.author.toString() === userId.toString();

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Không có quyền xóa confession này' });
        }

        await Confession.findByIdAndDelete(id);
        res.json({ message: 'Xóa confession thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
