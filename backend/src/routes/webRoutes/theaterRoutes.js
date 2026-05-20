import express from 'express';
import * as adminTheaterController from '../../controllers/web/adminTheaterController.js';

const router = express.Router();

// Expose public endpoints to list theaters and cities
router.get('/', adminTheaterController.getAllTheaters);
router.get('/cities', adminTheaterController.getCities);

export default router;
