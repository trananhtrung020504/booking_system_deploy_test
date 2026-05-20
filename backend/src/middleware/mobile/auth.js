import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../../config/env_vars.js';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: "Mã xác thực không hợp lệ (Mobile)"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, ENV_VARS.JWT_ACCESS_SECRET);
        req.userId = decoded.id;
        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token hết hạn hoặc không hợp lệ"
        });
    }
};
