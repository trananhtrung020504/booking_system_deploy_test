import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../../config/env_vars.js';
import prisma from '../../config/database.js';

export const verifyAdminRole = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'ADMIN') {
            return res.status(403).json({ 
                message: "Forbidden: Admin access required",
                role: user.role 
            });
        }

        req.admin = user;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
