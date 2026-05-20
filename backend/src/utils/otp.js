import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { ENV_VARS } from '../config/env_vars.js';

export const generateOTP = () => {
    return crypto.randomInt(1000, 9999);
};

export const hashOTP = (data) => {
    return crypto
        .createHmac('sha256', ENV_VARS.OTP_SECRET)
        .update(data)
        .digest('hex');
};

export const verifyOTP = (hashedOTP, data) => {
    const newHashedOTP = hashOTP(data);
    return newHashedOTP === hashedOTP;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ENV_VARS.EMAIL_USER,
        pass: ENV_VARS.EMAIL_PASS,
    },
});

export const sendOTPtoEmail = async (email, otp) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Xác thực tài khoản BookingSystem</h2>
            <p>Chào bạn,</p>
            <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #e74c3c;">${otp}</strong></p>
            <p>Mã này sẽ hết hạn sau 2 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <hr style="border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #777; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
    `;

    const message = {
        from: `"BookingSystem" <${ENV_VARS.EMAIL_USER}>`,
        to: email,
        subject: 'Mã xác thực OTP - BookingSystem',
        html: htmlContent
    };

    const info = await transporter.sendMail(message);
    return info.messageId;
};
