import express from 'express';
import * as adminVoucherController from '../../controllers/web/adminVoucherController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';

const router = express.Router();

router.use(verifyAdminRole);

router.get('/', adminVoucherController.getAdminVouchers);
router.post('/', adminVoucherController.createVoucher);
router.put('/:id', adminVoucherController.updateVoucher);
router.patch('/:id/toggle-active', adminVoucherController.toggleVoucherActive);
router.delete('/:id', adminVoucherController.deleteVoucher);

export default router;
