import express from 'express';
import * as paymentController from '../../controllers/web/paymentController.js';
import { verifyToken } from '../../middleware/web/auth.js';

const router = express.Router();

router.post('/vnpay', verifyToken, paymentController.createVNPayPayment);
router.post('/vnpay/create', verifyToken, paymentController.createVNPayPayment);
router.get('/vnpay/return', paymentController.vnpayReturn);

router.post('/zalopay', verifyToken, paymentController.createZaloPay);
router.post('/zalopay/create', verifyToken, paymentController.createZaloPay);
router.post('/zalopay/callback', paymentController.zaloPayCallback);

export default router;
