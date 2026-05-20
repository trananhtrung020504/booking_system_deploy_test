import * as OtpUtils from '../../utils/otp.js';
import * as TokenUtils from '../../utils/token.js';
import prisma from '../../config/database.js';

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const otp = OtpUtils.generateOTP();
        const ttl = 1000 * 60 * 2; // 2 mins
        const expires = Date.now() + ttl;
        const data = `${email}.${otp}.${expires}`;
        const hashedOTP = OtpUtils.hashOTP(data);

        try {
            await OtpUtils.sendOTPtoEmail(email, otp);
        } catch (error) {
        console.error(`[Controller Error] [mobile/authController.js]:`, error);
            console.error(error);
            return res.status(500).json({ message: "Error sending OTP to email" });
        }

        res.json({
            hash: `${hashedOTP}.${expires}`,
            email,
            message: "OTP sent to email successfully"
        });
    } catch (error) {
        console.error(`[Controller Error] [mobile/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp, hash } = req.body;

        if (!email || !otp || !hash) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const [hashedOTP, expires] = hash.split(".");
        if (Date.now() > +expires) {
            return res.status(401).json({ message: "OTP Expired" });
        }

        const data = `${email}.${otp}.${expires}`;
        const isValid = OtpUtils.verifyOTP(hashedOTP, data);

        if (!isValid) {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({ data: { email } });
        }

        const { accessToken, refreshToken } = TokenUtils.generateTokens({ id: user.id, email: user.email });
        await TokenUtils.storeRefreshToken(user.id, refreshToken);

        res.json({
            message: "Verify successful",
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        console.error(`[Controller Error] [mobile/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken: oldRefreshToken } = req.body;

        if (!oldRefreshToken) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        let decoded;
        try {
            decoded = TokenUtils.verifyRefreshToken(oldRefreshToken);
        } catch (error) {
        console.error(`[Controller Error] [mobile/authController.js]:`, error);
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await prisma.user.findFirst({
            where: { id: decoded.id, refreshToken: oldRefreshToken }
        });
        
        if (!user) {
            return res.status(401).json({ message: "Refresh token not found or mismatch" });
        }

        const { accessToken, refreshToken } = TokenUtils.generateTokens({ id: user.id, email: user.email });
        await TokenUtils.storeRefreshToken(user.id, refreshToken);

        res.json({
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(`[Controller Error] [mobile/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) return res.status(400).json({ message: "User ID required" });

        await TokenUtils.deleteRefreshToken(id);
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(`[Controller Error] [mobile/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
