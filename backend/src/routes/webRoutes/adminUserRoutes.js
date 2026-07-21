import express from 'express';
import * as adminUserController from '../../controllers/web/adminUserController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';

const router = express.Router();

router.use(verifyAdminRole);

router.get('/', adminUserController.getAllUsers);
router.patch('/:id/toggle-active', adminUserController.toggleUserActive);

export default router;
