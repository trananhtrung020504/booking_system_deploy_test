import express from 'express';
import * as adminBookingController from '../../controllers/web/adminBookingController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';

const router = express.Router();

router.use(verifyAdminRole);

router.get('/dashboard/stats', adminBookingController.getDashboardStats);
router.get('/reports/bookings', adminBookingController.getBookingsReport);
router.get('/reports/revenue', adminBookingController.getRevenueReport);

router.get('/', adminBookingController.getAllBookings);
router.get('/:id', adminBookingController.getBookingDetail);
router.patch('/:id/cancel', adminBookingController.cancelBooking);

export default router;
