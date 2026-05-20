import express from 'express';
import * as adminBookingController from '../../controllers/web/adminBookingController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';

const router = express.Router();

// All admin routes require admin role verification
router.use(verifyAdminRole);

// Booking management
router.get('/', adminBookingController.getAllBookings);
router.get('/:id', adminBookingController.getBookingDetail);
router.patch('/:id/cancel', adminBookingController.cancelBooking);

// Dashboard & Reports
router.get('/dashboard/stats', adminBookingController.getDashboardStats);
router.get('/reports/bookings', adminBookingController.getBookingsReport);
router.get('/reports/revenue', adminBookingController.getRevenueReport);

export default router;
