import express from 'express';
import * as adminShowController from '../../controllers/web/adminShowController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';

const router = express.Router();

router.use(verifyAdminRole);

router.post('/', adminShowController.createShow);
router.get('/', adminShowController.getAllShows);
router.get('/:id', adminShowController.getShowById);
router.put('/:id', adminShowController.updateShow);
router.delete('/:id', adminShowController.deleteShow); // Soft delete
router.delete('/:id/hard', adminShowController.hardDeleteShow); // Permanent delete
router.get('/:id/analytics', adminShowController.getShowAnalytics);
router.get('/:id/seats-status', adminShowController.getShowSeatsStatus);

export default router;
