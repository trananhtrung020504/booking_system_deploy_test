import express from 'express';
import * as paymentController from '../../controllers/mobile/paymentController.js';
import { verifyToken } from '../../middleware/mobile/auth.js';

const router = express.Router();

router.post('/vnpay/create', verifyToken, paymentController.createVNPayPayment);
router.get('/vnpay/return', paymentController.vnpayReturn);

router.post('/zalopay/create', verifyToken, paymentController.createZaloPay);
router.post('/zalopay/callback', paymentController.zaloPayCallback);

export default router;
