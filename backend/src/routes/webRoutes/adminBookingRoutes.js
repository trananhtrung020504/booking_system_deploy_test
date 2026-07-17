import express from 'express';
import * as adminBookingController from '../../controllers/web/adminBookingController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';

const router = express.Router();

router.use(verifyAdminRole);

router.get('/', adminBookingController.getAllBookings);
router.get('/:id', adminBookingController.getBookingDetail);
router.patch('/:id/cancel', adminBookingController.cancelBooking);

router.get('/dashboard/stats', adminBookingController.getDashboardStats);
router.get('/reports/bookings', adminBookingController.getBookingsReport);
router.get('/reports/revenue', adminBookingController.getRevenueReport);

export default router;
