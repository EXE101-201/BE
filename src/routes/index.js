import express from 'express';
import authRoutes from './auth.routes.js';
import contentRoutes from './content.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import confessionRoutes from './confession.routes.js';
import { protect } from '../middleware/auth.js';

import articleRoutes from './article.routes.js';
const router = express.Router();

// Auth routes (no prefix)
// Auth routes (no prefix)
router.use('/auth', authRoutes);
router.use('/content', protect, contentRoutes);
router.use('/articles', articleRoutes);
router.use('/users', protect, userRoutes);
router.use('/admin', protect, adminRoutes);
router.use('/confessions', protect, confessionRoutes);


export default router;

