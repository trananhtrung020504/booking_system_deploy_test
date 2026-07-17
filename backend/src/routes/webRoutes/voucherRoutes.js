import express from 'express';
import * as voucherController from '../../controllers/web/voucherController.js';

const router = express.Router();

router.get('/', voucherController.getAllVouchers);

export default router;
