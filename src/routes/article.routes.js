import express from 'express';
import { getArticleById, createArticle } from '../controllers/article.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', getArticleById);
router.post('/', protect, admin, createArticle);

export default router;
