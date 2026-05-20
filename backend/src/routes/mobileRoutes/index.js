import express from 'express';
import authRoutes from './authRoutes.js';
import movieRoutes from './movieRoutes.js';
import showRoutes from './showRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import { verifyToken } from '../../middleware/mobile/auth.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/shows', showRoutes);

// Protected routes
router.use('/bookings', verifyToken, bookingRoutes);
router.use('/payment', paymentRoutes);

export default router;
