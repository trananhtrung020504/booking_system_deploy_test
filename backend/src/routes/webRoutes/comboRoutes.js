import express from 'express';
import * as comboController from '../../controllers/web/comboController.js';
import { verifyToken } from '../../middleware/web/auth.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';
import { uploadPoster } from '../../middleware/handle_multer.js';

const router = express.Router();

const verifyAdminWhenRequestingAll = (req, res, next) => {
    if (req.query.all === 'true') {
        return verifyToken(req, res, () => verifyAdminRole(req, res, next));
    }
    next();
};

router.get('/', verifyAdminWhenRequestingAll, comboController.getCombos);

router.post('/', verifyToken, verifyAdminRole, uploadPoster.single('image'), comboController.createCombo);
router.put('/:id', verifyToken, verifyAdminRole, uploadPoster.single('image'), comboController.updateCombo);
router.delete('/:id', verifyToken, verifyAdminRole, comboController.deleteCombo);

export default router;
