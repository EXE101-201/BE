import express from 'express';
import { createConfession, getApprovedConfessions, getConfessionById } from '../controllers/confession.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getApprovedConfessions);
router.get('/:id', getConfessionById);

// Protected routes (optional author tracking)
const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization) {
        return protect(req, res, next);
    }
    next();
};

router.post('/', optionalProtect, createConfession);

export default router;
