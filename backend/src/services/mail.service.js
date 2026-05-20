import nodemailer from 'nodemailer';
import { ENV_VARS } from '../config/env_vars.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ENV_VARS.EMAIL_USER,
        pass: ENV_VARS.EMAIL_PASS,
    },
});

export const sendMail = async (options) => {
    const message = {
        from: `"BookingSystem" <${ENV_VARS.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };
    return await transporter.sendMail(message);
};

export const sendOTPtoEmail = async (email, otp) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #e11d48; margin: 0; font-size: 28px;">BookingSystem</h1>
            </div>
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">Xác thực tài khoản</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Chào bạn, mã OTP để đăng nhập vào hệ thống của bạn là:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #e11d48; letter-spacing: 5px; padding: 10px 20px; border: 2px dashed #e11d48; border-radius: 8px;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-size: 14px; text-align: center;">Mã này sẽ hết hạn sau 2 phút.</p>
            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
    `;
    return await sendMail({ email, subject: 'Mã xác thực OTP - BookingSystem', html });
};

export const sendBookingConfirmationEmail = async (email, booking) => {
    const seatNames = booking.seats.map(s => `${s.row}${s.column}`).join(', ');
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #e11d48; padding: 25px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Xác nhận đặt vé thành công!</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #1f2937;">Chào bạn, cảm ơn bạn đã lựa chọn BookingSystem. Dưới đây là thông tin chi tiết về vé của bạn:</p>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h3 style="margin-top: 0; color: #e11d48; font-size: 20px;">${booking.show.movie.title}</h3>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Mã đặt vé:</b> <span style="color: #1f2937;">${booking.bookingRef}</span></p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Rạp:</b> ${booking.show.theater.name}</p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Phòng:</b> ${booking.show.screen.name}</p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Thời gian:</b> ${new Date(booking.show.startTime).toLocaleString('vi-VN')}</p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Ghế:</b> <span style="color: #e11d48; font-weight: bold;">${seatNames}</span></p>
                    <p style="margin: 15px 0 0 0; font-size: 18px; color: #1f2937;"><b>Tổng cộng:</b> <span style="color: #10b981;">${booking.total.toLocaleString()}đ</span></p>
                </div>
                <p style="font-size: 14px; color: #6b7280; font-style: italic;">Vui lòng đưa mã đặt vé này cho nhân viên tại quầy để nhận vé cứng.</p>
                <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">BookingSystem - Chúc bạn xem phim vui vẻ!</p>
            </div>
        </div>
    `;
    return await sendMail({ email, subject: `Xác nhận đặt vé: ${booking.show.movie.title}`, html });
};

export const sendBookingExpiredRefundEmail = async (email, booking, amount, transactionNo) => {
    const seatNames = booking.seats.map(s => `${s.row}${s.column}`).join(', ');
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #f59e0b; padding: 25px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Thông báo giao dịch quá hạn giữ ghế</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #1f2937;">Chào bạn, hệ thống ghi nhận bạn đã thanh toán thành công số tiền <b>${amount.toLocaleString()}đ</b> cho mã đặt vé <b>${booking.bookingRef}</b>.</p>
                <p style="font-size: 16px; color: #ef4444; font-weight: bold;">Tuy nhiên, giao dịch này được hoàn tất sau khi thời gian giữ ghế (10 phút) đã hết hạn. Hệ thống đã giải phóng ghế của bạn để đảm bảo công bằng cho người dùng khác.</p>
                
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h3 style="margin-top: 0; color: #f59e0b; font-size: 18px;">Thông tin đơn hàng quá hạn</h3>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Mã đặt vé:</b> ${booking.bookingRef}</p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Phim:</b> ${booking.show.movie.title}</p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Ghế giữ trước đó:</b> ${seatNames}</p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Số tiền đã thanh toán:</b> <span style="color: #10b981; font-weight: bold;">${amount.toLocaleString()}đ</span></p>
                    <p style="margin: 8px 0; color: #4b5563;"><b>Mã giao dịch cổng thanh toán:</b> ${transactionNo}</p>
                </div>
                
                <p style="font-size: 15px; color: #1f2937; line-height: 1.6;"><b>Hướng giải quyết:</b> Bộ phận Chăm sóc khách hàng (CSKH) của chúng tôi đã nhận được thông tin đối soát này và đang tiến hành xử lý hoàn tiền hoặc đổi suất chiếu tương đương cho bạn. Chúng tôi sẽ liên hệ với bạn trong vòng 24h làm việc qua email hoặc số điện thoại đăng ký.</p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">Nếu bạn có thắc mắc gấp, vui lòng liên hệ hotline của chúng tôi để được giải quyết nhanh nhất.</p>
                <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">BookingSystem - Rất xin lỗi vì sự bất tiện này!</p>
            </div>
        </div>
    `;
    return await sendMail({ email, subject: `[Cần đối soát hoàn tiền] Giao dịch quá hạn vé: ${booking.bookingRef}`, html });
};

