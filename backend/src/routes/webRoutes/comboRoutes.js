import express from 'express';
import * as comboController from '../../controllers/web/comboController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';
import { uploadPoster } from '../../middleware/handle_multer.js';

const router = express.Router();

router.get('/', comboController.getCombos);

router.post('/', verifyAdminRole, uploadPoster.single('image'), comboController.createCombo);
router.put('/:id', verifyAdminRole, uploadPoster.single('image'), comboController.updateCombo);
router.delete('/:id', verifyAdminRole, comboController.deleteCombo);

export default router;
