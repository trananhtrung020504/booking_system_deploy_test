import express from 'express';
import * as showController from '../../controllers/mobile/showController.js';

const router = express.Router();

router.get('/', showController.getShows);
router.get('/:id', showController.getShow);
router.get('/movie/:movieId', showController.getShowsByMovie);

export default router;
