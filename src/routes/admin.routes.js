import express from 'express';
import {
    getDashboardStats,
    getPendingConfessions,
    moderateConfession,
    getReportedComments,
    deleteComment,
    getBlacklist,
    addBlacklistKeyword,
    deleteBlacklistKeyword,
    getChatScripts,
    upsertChatScript,
    getAllContentAdmin,
    createContent,
    updateContent,
    deleteContent,
    getPremiumUsers,
    getRevenueStats
} from '../controllers/admin.controller.js';
import { admin } from '../middleware/auth.js';

const router = express.Router();

// Existing routes
router.get('/stats', admin, getDashboardStats);
router.get('/confessions/pending', admin, getPendingConfessions);
router.post('/confessions/moderate', admin, moderateConfession);

// 3. Comment Management
router.get('/comments/reported', admin, getReportedComments);
router.delete('/comments/:id', admin, deleteComment);
router.get('/blacklist', admin, getBlacklist);
router.post('/blacklist', admin, addBlacklistKeyword);
router.delete('/blacklist/:id', admin, deleteBlacklistKeyword);

// 4. Chatbot Management
router.get('/chat-scripts', admin, getChatScripts);
router.post('/chat-scripts', admin, upsertChatScript);

// 5. Content Management
router.get('/content', admin, getAllContentAdmin);
router.post('/content', admin, createContent);
router.put('/content/:id', admin, updateContent);
router.delete('/content/:id', admin, deleteContent);

// 6. Premium Management
router.get('/premium/users', admin, getPremiumUsers);
router.get('/premium/revenue', admin, getRevenueStats);

export default router;
