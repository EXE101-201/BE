import express from 'express';
import authRoutes from './auth.routes.js';

const router = express.Router();

// Auth routes (no prefix)
router.use('/auth', authRoutes);


export default router;

