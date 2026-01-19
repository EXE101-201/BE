import express from 'express';
import { upgradePremium, getMe, updateProfile } from '../controllers/user.controller.js';
import { logActivity } from '../controllers/activity.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.post('/upgrade', protect, upgradePremium);
router.put('/profile', protect, updateProfile);
router.post('/log', protect, logActivity);

export default router;
