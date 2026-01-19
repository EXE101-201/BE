import express from 'express';
import { getAllContent, getContentById, createContent } from '../controllers/content.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllContent);
router.get('/:id', getContentById);
router.post('/', protect, admin, createContent);

export default router;
