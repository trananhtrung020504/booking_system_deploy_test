import express from 'express';
import * as movieController from '../../controllers/mobile/movieController.js';
import { uploadMiddleware, handleMulterError } from '../../middleware/handle_multer.js';
import { uploadMoviePosterToR2 } from '../../middleware/upload.js';
import { verifyToken } from '../../middleware/mobile/auth.js';

const router = express.Router();

router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovie);

router.post(
    '/',
    verifyToken,
    uploadMiddleware.single('poster'),
    handleMulterError,
    uploadMoviePosterToR2,
    movieController.createMovie
);

export default router;
