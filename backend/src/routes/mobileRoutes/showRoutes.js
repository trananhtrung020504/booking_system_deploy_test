import express from 'express';
import * as showController from '../../controllers/mobile/showController.js';

const router = express.Router();

router.get('/', showController.getShows);
router.get('/movie/:movieId', showController.getShowsByMovie);
router.get('/:id', showController.getShow);

export default router;
