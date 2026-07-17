import express from 'express';
import * as adminTheaterController from '../../controllers/web/adminTheaterController.js';

const router = express.Router();

router.get('/', adminTheaterController.getAllTheaters);
router.get('/cities', adminTheaterController.getCities);

export default router;
