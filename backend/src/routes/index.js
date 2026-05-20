import mobileRoutes from './mobileRoutes/index.js';
import webRoutes from './webRoutes/index.js';
import { globalLimiter } from '../middleware/rateLimiter.js';

export const initRoutes = (app, io) => {
    app.io = io;

    app.use('/api', globalLimiter);
    app.use('/api/v1/mobile', mobileRoutes);
    app.use('/api/v1/web', webRoutes);
};
