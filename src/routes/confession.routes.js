import express from 'express';
import { createConfession, getApprovedConfessions, getConfessionById, addReaction, deleteConfession } from '../controllers/confession.controller.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import commentRoutes from './comment.routes.js';

const router = express.Router();

// Public routes (with optional user context)
router.get('/', optionalProtect, getApprovedConfessions);
router.get('/tags', (async (req, res, next) => {
    try {
        const Confession = (await import('../models/Confession.js')).default;
        const tags = await Confession.distinct('tags', { status: 'approved' });
        res.json(tags);
    } catch (err) {
        next(err);
    }
}));
router.get('/:id', optionalProtect, getConfessionById);

// Protected routes
router.post('/:id/reactions', protect, addReaction);
router.delete('/:id', protect, deleteConfession);

// Comments subroutes
router.use('/:confessionId/comments', commentRoutes);

router.post('/', optionalProtect, createConfession);

export default router;
