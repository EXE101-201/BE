import express from 'express';
import { getComments, addComment } from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Get comments for a confession
router.get('/', getComments);

// Add comment (protected)
router.post('/', protect, addComment);

export default router;