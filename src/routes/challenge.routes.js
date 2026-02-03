import express from 'express';
import { getAllChallenges, joinChallenge, updateProgress } from '../controllers/challenge.controller.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalProtect, getAllChallenges);
router.post('/join', protect, joinChallenge);
router.put('/:challengeId/progress', protect, updateProgress);

export default router;
