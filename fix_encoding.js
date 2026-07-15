const fs = require('fs');
let c = fs.readFileSync('frontend/web/app/bookings/page.tsx', 'utf8');
const repl = {
    'Ä Ã£ xÃ¡c nháº\xADn': 'Đã xác nhận',
    'Chá»  thanh toÃ¡n': 'Chờ thanh toán',
    'Ä Ã£ há»§y': 'Đã hủy',
    'Háº¿t háº¡n': 'Hết hạn',
    'CÃ²n láº¡i: ': 'Còn lại: ',
    'VÃ© cá»§a tÃ´i': 'Vé của tôi',
    'Táº¥t cáº£': 'Tất cả',
    'Ä Ã£ diá»…n ra': 'Đã diễn ra',
    'MÃ£ vÃ©: ': 'Mã vé: ',
    'Thá» i gian Ä‘áº·t: ': 'Thời gian đặt: ',
    'Ä‘': 'đ',
    'Báº¡n cháº¯c cháº¯n muá»‘n há»§y?': 'Bạn chắc chắn muốn hủy?',
    'Tá»± Ä‘á»™ng há»§y náº¿u khÃ´ng thanh toÃ¡n trong 10 phÃºt.': 'Tự động hủy nếu không thanh toán trong 10 phút.',
    'Thanh toÃ¡n thÃ\xA0nh cÃ´ng. Vui lÃ²ng chuáº©n bá»‹ vÃ© QR khi vÃ\xA0o ráº¡p.': 'Thanh toán thành công. Vui lòng chuẩn bị vé QR khi vào rạp.',
    'Suáº¥t chiáº¿u Ä‘Ã£ káº¿t thÃºc. Cáº£m Æ¡n báº¡n Ä‘Ã£ sá»\xAD dá»¥ng dá»‹ch vá»¥!': 'Suất chiếu đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ!',
    'Giao dá»‹ch Ä‘Ã£ bá»‹ há»§y. Chá»— ngá»“i Ä‘Ã£ Ä‘Æ°á»£c giáº£i phÃ³ng.': 'Giao dịch đã bị hủy. Chỗ ngồi đã được giải phóng.',
    'Giao dá»‹ch quÃ¡ háº¡n thanh toÃ¡n vÃ\xA0 Ä‘Ã£ bá»‹ há»‡ thá»‘ng tá»± Ä‘á»™ng há»§y.': 'Giao dịch quá hạn thanh toán và đã bị hệ thống tự động hủy.',
    'XÃ¡c nháº\xADn há»§y': 'Xác nhận hủy',
    'Quay láº¡i': 'Quay lại',
    'Thanh toÃ¡n ngay': 'Thanh toán ngay',
    'Há»§y vÃ©': 'Hủy vé',
    'Xem vÃ© QR': 'Xem vé QR',
    'TrÆ°á»›c': 'Trước',
    'Tiáº¿p': 'Tiếp',
    'KhÃ´ng tÃ¬m tháº¥y vÃ©': 'Không tìm thấy vé',
    'Báº¡n chÆ°a thá»±c hiá»‡n báº¥t ká»³ giao dá»‹ch Ä‘áº·t vÃ© nÃ\xA0o.': 'Bạn chưa thực hiện bất kỳ giao dịch đặt vé nào.',
    'Báº¡n khÃ´ng cÃ³ vÃ© nÃ\xA0o á»Ÿ tráº¡ng thÃ¡i Ä‘Ã£ xÃ¡c nháº\xADn.': 'Bạn không có vé nào ở trạng thái đã xác nhận.',
    'Báº¡n khÃ´ng cÃ³ vÃ© nÃ\xA0o Ä‘ang chá»  thanh toÃ¡n.': 'Bạn không có vé nào đang chờ thanh toán.',
    'Báº¡n khÃ´ng cÃ³ vÃ© nÃ\xA0o á»Ÿ tráº¡ng thÃ¡i Ä‘Ã£ há»§y.': 'Bạn không có vé nào ở trạng thái đã hủy.',
    'KhÃ¡m phÃ¡ phim ngay': 'Khám phá phim ngay',
    'Thá» i gian': 'Thời gian',
    'Gháº¿': 'Ghế',
    'Vui lÃ²ng xuáº¥t trÃ¬nh mÃ£ QR nÃ\xA0y táº¡i quáº§y soÃ¡t vÃ© Ä‘á»ƒ quÃ©t check-in trÆ°á»›c khi vÃ\xA0o phÃ²ng chiáº¿u.': 'Vui lòng xuất trình mã QR này tại quầy soát vé để quét check-in trước khi vào phòng chiếu.',
    'Ä Ã³ng': 'Đóng',
    'Thanh toÃ¡n thÃ\xA0nh cÃ´ng nhÆ°ng Ä‘Ã£ quÃ¡ háº¡n giá»¯ gháº¿ 10 phÃºt. Há»‡ thá»‘ng khÃ´ng thá»ƒ xuáº¥t vÃ©. Vui lÃ²ng liÃªn há»‡ CSKH Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ hoÃ\xA0n tiá» n hoáº·c Ä‘á»•i vÃ©!': 'Thanh toán thành công nhưng đã quá hạn giữ ghế 10 phút. Hệ thống không thể xuất vé. Vui lòng liên hệ CSKH để được hỗ trợ hoàn tiền hoặc đổi vé!',
    'KhÃ´ng thá»ƒ há»§y vÃ©': 'Không thể hủy vé',
    'Thanh toÃ¡n thÃ\xA0nh cÃ´ng! VÃ© cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº\xADn.': 'Thanh toán thành công! Vé của bạn đã được xác nhận.',
    'VÃ©': 'Vé'
};
for(const [k,v] of Object.entries(repl)) {
    c = c.split(k).join(v);
}
fs.writeFileSync('frontend/web/app/bookings/page.tsx', c);
