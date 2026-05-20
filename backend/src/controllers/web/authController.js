import * as OtpUtils from '../../utils/otp.js';
import * as TokenUtils from '../../utils/token.js';
import prisma from '../../config/database.js';
import bcrypt from 'bcryptjs';
import { sendOTPtoEmail } from '../../services/mail.service.js';
import { ENV_VARS } from '../../config/env_vars.js';

const getCookieOptions = (maxAge = null) => {
    const isProd = ENV_VARS.NODE_ENV === 'production';
    const cookieDomain = ENV_VARS.COOKIE_DOMAIN;
    // Cấu hình cookie tối ưu cho cả production (custom domain & default domain) và development (localhost):
    // - Nếu có custom domain chung (cookieDomain): dùng 'Lax' để bảo mật và tránh bị trình duyệt chặn ở tab ẩn danh.
    // - Nếu ở Production nhưng khác domain (Vercel & Render mặc định): dùng 'None' và 'secure' để truyền cookie chéo trang.
    // - Nếu ở local development (localhost): dùng 'Lax' để chạy bình thường.
    return {
        ...(maxAge && { maxAge }),
        httpOnly: true,
        secure: isProd,
        sameSite: cookieDomain ? 'Lax' : (isProd ? 'None' : 'Lax'),
        ...(cookieDomain && { domain: cookieDomain })
    };
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Email not found. Please signup first." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const { accessToken, refreshToken } = TokenUtils.generateTokens({ id: user.id, email: user.email });
        await TokenUtils.storeRefreshToken(user.id, refreshToken);

        res.cookie('accessToken', accessToken, getCookieOptions(1000 * 60 * 60));
        res.cookie('refreshToken', refreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));
        const { password: _, refreshToken: __, ...safeUser } = user;
        res.json({ message: "Login successful", user: safeUser });
    } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const signup = async (req, res) => {
    try {
        const { email, password, name, phone, otp, hash } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        if (!otp || !hash) {
            return res.status(400).json({ message: "Mã xác thực OTP là bắt buộc để đăng ký tài khoản" });
        }

        // Verify OTP signature
        const [hashedOTP, expires] = hash.split('.');
        if (Date.now() > Number(expires)) {
            return res.status(400).json({ message: "Mã OTP đã hết hạn, vui lòng gửi lại mã mới" });
        }
        const data = `${email}.${otp}.${expires}`;
        const isVerified = OtpUtils.verifyOTP(hashedOTP, data);
        if (!isVerified) {
            return res.status(400).json({ message: "Mã OTP không hợp lệ, vui lòng kiểm tra lại" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered. Please login instead." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name: name || null, phone: phone || null }
        });
        const { accessToken, refreshToken } = TokenUtils.generateTokens({ id: user.id, email: user.email });
        await TokenUtils.storeRefreshToken(user.id, refreshToken);
        res.cookie('accessToken', accessToken, getCookieOptions(1000 * 60 * 60));
        res.cookie('refreshToken', refreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));
        const { password: _, refreshToken: __, ...safeUser } = user;
        res.json({ message: "Signup successful", user: safeUser });
    } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        // Check if email already registered
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã được đăng ký trên hệ thống, vui lòng đăng nhập" });
        }

        const otp = process.env.NODE_ENV === 'production' ? '1234' : OtpUtils.generateOTP();
        const ttl = 1000 * 60 * 5; // 5 minutes TTL for web signup OTP
        const expires = Date.now() + ttl;
        const data = `${email}.${otp}.${expires}`;
        const hashedOTP = OtpUtils.hashOTP(data);
        console.log(`[sendOtp] Bắt đầu gọi hàm sendOTPtoEmail cho email: ${email}`);
        await sendOTPtoEmail(email, otp);
        console.log(`[sendOtp] Gửi email thành công tới: ${email}`);
        res.json({
            hash: `${hashedOTP}.${expires}`,
            email,
            message: "OTP sent to email successfully"
        });
    } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
        console.error(`[sendOtp] LỖI CHI TIẾT KHI GỬI OTP:`, error);
        res.status(500).json({ 
            message: "Lỗi chi tiết khi gửi mail: " + error.message,
            error_code: error.code,
            error_command: error.command
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken: oldRefreshToken } = req.cookies;

        if (!oldRefreshToken) {
            return res.status(401).json({ message: "Refresh token not found in cookies" });
        }

        let decoded;
        try {
            decoded = TokenUtils.verifyRefreshToken(oldRefreshToken);
        } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
            return res.status(401).json({ message: "TokenExpiredError" });
        }

        const user = await prisma.user.findFirst({
            where: { id: decoded.id, refreshToken: oldRefreshToken }
        });

        if (!user) {
            return res.status(401).json({ message: "Refresh token mismatch" });
        }

        const { accessToken, refreshToken } = TokenUtils.generateTokens({ id: user.id, email: user.email });
        await TokenUtils.storeRefreshToken(user.id, refreshToken);

        res.cookie('accessToken', accessToken, getCookieOptions(1000 * 60 * 60));
        res.cookie('refreshToken', refreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));

        res.json({ message: "Tokens refreshed" });
    } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { avatar: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { password, refreshToken, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const id = req.user?.id;
        if (id) {
            await TokenUtils.deleteRefreshToken(id);
        }

        const cookieOptions = getCookieOptions();
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(`[Controller Error] [web/authController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
