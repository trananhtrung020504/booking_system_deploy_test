import express from 'express';
import * as showController from '../../controllers/web/showController.js';

const router = express.Router();

router.get('/', showController.getShows);
router.get('/:id', showController.getShow);
router.get('/movie/:movieId', showController.getShowsByMovie);
router.get('/movie/:movieId/dates', showController.getAvailableDates);

export default router;
