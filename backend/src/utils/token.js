import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../config/env_vars.js';
import prisma from '../config/database.js';

export const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, ENV_VARS.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, ENV_VARS.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, ENV_VARS.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, ENV_VARS.JWT_REFRESH_SECRET);
};

export const storeRefreshToken = async (userId, token) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: token }
    });
};

export const findRefreshToken = async (userId, token) => {
    return await prisma.user.findFirst({
        where: { id: userId, refreshToken: token }
    });
};

export const deleteRefreshToken = async (userId) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null }
    });
};
