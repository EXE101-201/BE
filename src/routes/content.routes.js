import express from 'express';
import { getAllContent, getContentById, createContent, incrementViewCount } from '../controllers/content.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllContent);
router.get('/:id', protect, getContentById);
router.post('/:id/view', protect, incrementViewCount);
router.post('/', protect, admin, createContent);

export default router;
