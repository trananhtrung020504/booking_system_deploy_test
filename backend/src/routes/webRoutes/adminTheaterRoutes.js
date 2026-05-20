import express from 'express';
import * as adminTheaterController from '../../controllers/web/adminTheaterController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';
import { uploadLogo } from '../../middleware/handle_multer.js';

const router = express.Router();

// All admin routes require admin role verification
router.use(verifyAdminRole);

// Theater management
router.post('/', uploadLogo.single('logo'), adminTheaterController.createTheater);
router.get('/', adminTheaterController.getAllTheaters);
router.get('/cities', adminTheaterController.getCities);
router.put('/:id', uploadLogo.single('logo'), adminTheaterController.updateTheater);
router.delete('/:id', adminTheaterController.deleteTheater);
router.get('/:id/analytics', adminTheaterController.getTheaterAnalytics);

export default router;
