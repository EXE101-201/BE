import express from 'express';
import { getTopics, startChat, sendMessage, getChatHistory, clearChatHistory } from '../controllers/chatbot.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/topics', getTopics);

// Protected routes
router.post('/start', protect, startChat);
router.post('/message', protect, sendMessage);
router.get('/history', protect, getChatHistory);
router.delete('/history', protect, clearChatHistory);

export default router;