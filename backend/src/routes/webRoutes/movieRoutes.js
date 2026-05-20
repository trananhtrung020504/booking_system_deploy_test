import express from 'express';
import * as movieController from '../../controllers/web/movieController.js';

const router = express.Router();

router.get('/', movieController.getMovies);
router.get('/genres', movieController.getGenres);
router.get('/:id', movieController.getMovie);

export default router;
