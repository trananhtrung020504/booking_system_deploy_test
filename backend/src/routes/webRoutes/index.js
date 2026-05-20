import express from 'express';
import authRoutes from './authRoutes.js';
import movieRoutes from './movieRoutes.js';
import showRoutes from './showRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import adminRoutes from './adminRoutes.js';
import comboRoutes from './comboRoutes.js';
import theaterRoutes from './theaterRoutes.js';
import voucherRoutes from './voucherRoutes.js';
import chatbotRoutes from './chatbotRoutes.js';
import { verifyToken } from '../../middleware/web/auth.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/shows', showRoutes);
router.use('/combos', comboRoutes);
router.use('/theaters', theaterRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/chatbot', chatbotRoutes);

router.use('/bookings', verifyToken, bookingRoutes);
router.use('/payment', paymentRoutes);

router.use('/admin', adminRoutes);

export default router;
