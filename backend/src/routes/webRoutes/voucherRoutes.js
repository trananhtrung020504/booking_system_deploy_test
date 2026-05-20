import express from 'express';
import * as voucherController from '../../controllers/web/voucherController.js';

const router = express.Router();

// Get active vouchers in the system
router.get('/', voucherController.getAllVouchers);

export default router;
