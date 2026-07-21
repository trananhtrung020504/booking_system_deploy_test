import express from 'express';
import * as adminMovieController from '../../controllers/web/adminMovieController.js';
import { verifyAdminRole } from '../../middleware/web/adminAuth.js';
import { uploadPoster } from '../../middleware/handle_multer.js';

const router = express.Router();

router.use(verifyAdminRole);

router.post('/', uploadPoster.single('poster'), adminMovieController.createMovie);
router.get('/', adminMovieController.getAllMovies);
router.delete('/:id/hard', adminMovieController.hardDeleteMovie); // Permanent delete
router.get('/:id/analytics', adminMovieController.getMovieAnalytics);
router.get('/:id', adminMovieController.getMovieById);
router.put('/:id', uploadPoster.single('poster'), adminMovieController.updateMovie);
router.delete('/:id', adminMovieController.deleteMovie); // Soft delete

export default router;
