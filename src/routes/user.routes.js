import express from 'express';
import { upgradePremium, getMe, updateProfile, activateTrial } from '../controllers/user.controller.js';
import { logActivity } from '../controllers/activity.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.post('/upgrade', protect, upgradePremium);
router.put('/profile', protect, updateProfile);
router.post('/log', protect, logActivity);
router.post('/activate-trial', protect, activateTrial);

export default router;
