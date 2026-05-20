import express from 'express';
import * as bookingController from '../../controllers/mobile/bookingController.js';

const router = express.Router();

router.post('/create', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);

export default router;
