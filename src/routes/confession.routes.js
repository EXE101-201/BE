import express from 'express';
import { createConfession, getApprovedConfessions, getConfessionById, addReaction } from '../controllers/confession.controller.js';
import { protect } from '../middleware/auth.js';
import commentRoutes from './comment.routes.js';

const router = express.Router();

// Public routes
router.get('/', getApprovedConfessions);
router.get('/:id', getConfessionById);

// Protected routes
router.post('/:id/reactions', protect, addReaction);

// Comments subroutes
router.use('/:confessionId/comments', commentRoutes);

// Protected routes (optional author tracking)
const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization) {
        return protect(req, res, next);
    }
    next();
};

router.post('/', optionalProtect, createConfession);

export default router;
