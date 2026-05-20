import express from 'express';
import * as authController from '../../controllers/web/authController.js';
import { verifyToken } from '../../middleware/web/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, authController.login);
router.post('/signup', authLimiter, authController.signup);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/refresh-token', authController.refreshToken);
router.get('/refresh-token', authController.refreshToken);

// Protected
router.get('/me', verifyToken, authController.getMe);
router.post('/logout', verifyToken, authController.logout);

export default router;
