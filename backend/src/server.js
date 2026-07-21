import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';

import { ENV_VARS } from './config/env_vars.js';
import prisma from './config/database.js';
import redis from './config/redis.js';
import { initRoutes } from './routes/index.js';
import initSocket from './socket/socket.js';

import { closeRabbitConnection, setupRabbitTopology } from './rabbitmq/index.js';
import { initAllConsumers } from './rabbitmq/consumer/index.js';
import { initOpenSearch } from './services/opensearchService.js';
import { initBookingCleanupWorker } from './services/bookingCleanup.service.js';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://0dee-2001-ee0-4f4f-aa00-705e-3cab-a257-c13c.ngrok-free.app',
];

const corsOption = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Fallback allowing other origins if needed, or change to callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));
app.use(cors(corsOption));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, true);
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000
});

initSocket(io);
app.set('io', io);
initRoutes(app, io);

app.use((err, req, res, next) => {
    console.error(err);
    return res.status(500).json({ success: false, message: `Internal server error: ${err.message || err}` });
});

async function bootstrapServer() {
    try {
        await setupRabbitTopology();
        await initAllConsumers();
        await initOpenSearch();
        initBookingCleanupWorker(io);

        const PORT = ENV_VARS.PORT || 5000;
        const serverInstance = server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        serverInstance.timeout = 300000;
        serverInstance.keepAliveTimeout = 65000;
        serverInstance.headersTimeout = 66000;

    } catch (error) {
        console.error('Bootstrap error:', error);
        process.exit(1);
    }
}

bootstrapServer();

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    redis.disconnect();
    await closeRabbitConnection();
    server.close();
    process.exit(0);
});
