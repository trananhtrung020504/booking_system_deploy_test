import express from 'express';
import adminMovieRoutes from './adminMovieRoutes.js';
import adminTheaterRoutes from './adminTheaterRoutes.js';
import adminShowRoutes from './adminShowRoutes.js';
import adminBookingRoutes from './adminBookingRoutes.js';
import { verifyToken } from '../../middleware/web/auth.js';

const router = express.Router();

router.use(verifyToken);

router.use('/movies', adminMovieRoutes);
router.use('/theaters', adminTheaterRoutes);
router.use('/shows', adminShowRoutes);
router.use('/bookings', adminBookingRoutes);

export default router;
