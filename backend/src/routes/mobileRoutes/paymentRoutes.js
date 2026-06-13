import express from 'express';
import * as paymentController from '../../controllers/mobile/paymentController.js';
import { verifyToken } from '../../middleware/mobile/auth.js';

const router = express.Router();

router.post('/sepay', verifyToken, paymentController.createSepayPayment);
router.post('/sepay/webhook', paymentController.sepayWebhook);

export default router;
