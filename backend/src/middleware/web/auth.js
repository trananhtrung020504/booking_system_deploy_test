import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../../config/env_vars.js';
import prisma from '../../config/database.js';

export const verifyToken = async (req, res, next) => {
    const { accessToken } = req.cookies;

    if (!accessToken) {
        return res.status(401).json({
            message: "Mã xác thực không hợp lệ (Web) - Cookie missing"
        });
    }

    try {
        const decoded = jwt.verify(accessToken, ENV_VARS.JWT_ACCESS_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, isActive: true }
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Account is locked" });
        }

        req.userId = decoded.id;
        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token hết hạn hoặc không hợp lệ"
        });
    }
};
