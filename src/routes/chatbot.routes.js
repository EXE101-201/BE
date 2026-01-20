import express from 'express';
import { getTopics, startChat, sendMessage } from '../controllers/chatbot.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/topics', getTopics);

// Protected routes
router.post('/start', protect, startChat);
router.post('/message', protect, sendMessage);

export default router;