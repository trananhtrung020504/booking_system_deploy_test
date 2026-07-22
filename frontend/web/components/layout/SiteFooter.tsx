'use client';

import Link from 'next/link';
import { Film, MapPin, Phone, Mail, Ticket, Gift, CalendarDays, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const exploreLinks = [
  { label: 'Phim đang chiếu', href: '/movies?status=now-showing' },
  { label: 'Lịch chiếu', href: '/schedule' },
  { label: 'Rạp & giá vé', href: '/theaters' },
  { label: 'Khuyến mãi', href: '/promotions' },
];

const highlightLinks = [
  { label: 'Đặt vé nhanh', icon: Ticket, href: '/movies?status=now-showing' },
  { label: 'Săn voucher', icon: Gift, href: '/promotions' },
  { label: 'Sự kiện phim', icon: CalendarDays, href: '/schedule' },
];

export default function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/8 bg-[#14110B]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,234,187,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(252,234,187,0.10),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1550px] px-6 py-14 md:px-10">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <Film className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold uppercase tracking-tight text-white">RoPhim</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Cinema Booking Studio</div>
              </div>
            </Link>
            <p className="max-w-md text-sm leading-7 text-white/45">
              Nền tảng đặt vé xem phim trực tuyến hàng đầu — trải nghiệm điện ảnh đỉnh cao với công nghệ đặt chỗ thời gian thực và thanh toán an toàn.
            </p>
            <div className="grid gap-3 text-sm text-white/55">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-cinema-gold" />
                <span>RoPhim Hùng Vương • RoPhim Thủ Đức</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cinema-gold" />
                <span>Hotline: 1900 6017</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cinema-gold" />
                <span>support@rophim.vn</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-white">Khám phá</h3>
            <div className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <Link key={link.label} href={link.href} className="block text-sm text-white/50 transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-white">Điểm nhấn</h3>
            <div className="mt-5 space-y-3">
              {highlightLinks.map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/60 transition-all hover:border-white/15 hover:bg-white/7 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cinema-gold">Ưu đãi nổi bật</div>
            <h3 className="mt-3 text-2xl font-bold uppercase tracking-tight text-white">
              Đặt vé online — nhận ngay voucher giảm giá
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/45">
              Đăng ký thành viên RoPhim để nhận ưu đãi độc quyền, tích điểm đổi quà và cập nhật lịch chiếu sớm nhất.
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: 'default' }), 'mt-6 h-12 rounded-full bg-white text-[11px] font-semibold text-black hover:bg-cinema-gold')}
            >
              Gia nhập RoPhim
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-white/8 pt-5 text-xs text-white/35">
          © 2026 RoPhim. Hệ thống đặt vé xem phim trực tuyến. Bảo lưu mọi quyền.
        </div>
      </div>
    </footer>
  );
}
