import express from 'express';
import authRoutes from './auth.routes.js';
import contentRoutes from './content.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import confessionRoutes from './confession.routes.js';
import chatbotRoutes from './chatbot.routes.js';
import { protect, transaction } from '../middleware/auth.js';
import transactionRoutes from './transaction.routes.js';
import articleRoutes from './article.routes.js';
import challengeRoutes from './challenge.routes.js';
const router = express.Router();

// Auth routes (no prefix)
// Auth routes (no prefix)
router.use('/auth', authRoutes);
router.use('/content', protect, contentRoutes);
router.use('/articles', articleRoutes);
router.use('/users', protect, userRoutes);
router.use('/admin', protect, adminRoutes);
router.use('/confessions', confessionRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/challenges', challengeRoutes);

router.use('/transactions', transactionRoutes);


export default router;

