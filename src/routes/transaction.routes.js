import { protect, transaction } from '../middleware/auth.js';
import { addTransactionCallback, createOrder, checkStatus } from '../controllers/transaction.controller.js';
import express from 'express';
const router = express.Router();

router.post('/callback', transaction, addTransactionCallback);
router.post('/create', protect, createOrder);
router.get('/:id/status', protect, checkStatus);

export default router;