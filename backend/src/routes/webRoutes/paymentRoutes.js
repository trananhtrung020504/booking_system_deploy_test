import express from 'express';
import * as paymentController from '../../controllers/web/paymentController.js';
import { verifyToken } from '../../middleware/web/auth.js';

const router = express.Router();

router.post('/sepay', verifyToken, paymentController.createSepayPayment);
router.post('/sepay/webhook', paymentController.sepayWebhook);

export default router;
