'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, Popcorn, CalendarDays, ArrowRight, Clock3, Gift, Trophy, ShieldCheck } from 'lucide-react';

const quickStats = [
  { value: '20+', label: 'Phim đang mở bán', note: 'Cập nhật lịch chiếu theo tuần' },
  { value: '120+', label: 'Suất chiếu mỗi ngày', note: 'Phủ khung giờ từ sáng tới khuya' },
  { value: '2', label: 'Cụm rạp hoạt động', note: 'Sẵn sàng phục vụ nhiều khu vực' },
  { value: '4.8/5', label: 'Mức yêu thích', note: 'Trải nghiệm đặt vé mượt mà' },
];

const promoCards = [
  {
    icon: Gift,
    eyebrow: 'Voucher tuần này',
    title: 'Ưu đãi đặt vé online',
    description: 'Áp dụng mã giảm giá trực tiếp khi đặt vé và thanh toán trực tuyến.',
    cta: 'Xem khuyến mãi',
    href: '/promotions',
    accent: 'from-cinema-gold/25 via-cinema-gold/10 to-transparent',
  },
  {
    icon: Popcorn,
    eyebrow: 'Combo nổi bật',
    title: 'Bắp nước đi cùng suất chiếu',
    description: 'Chọn nhanh combo phù hợp ngay trong luồng đặt vé.',
    cta: 'Đặt vé ngay',
    href: '/movies?status=now-showing',
    accent: 'from-amber-300/25 via-amber-300/10 to-transparent',
  },
  {
    icon: Trophy,
    eyebrow: 'Thành viên',
    title: 'Theo dõi ưu đãi tài khoản',
    description: 'Quản lý thông tin cá nhân và lịch sử đặt vé trong một nơi.',
    cta: 'Xem hồ sơ',
    href: '/profile',
    accent: 'from-cinema-gold/20 via-cinema-gold/8 to-transparent',
  },
];

const eventCards = [
  {
    label: 'Đêm chiếu sớm',
    title: 'Suất sneak show cho phim hot cuối tuần',
    meta: '19:30 - Thứ 6',
    description: 'Mở bán sớm cho các bộ phim có nhu cầu cao.',
  },
  {
    label: 'Thứ 3 vui vẻ',
    title: 'Khung giờ ưu đãi cho nhóm bạn',
    meta: 'Cả ngày - Thứ 3',
    description: 'Ưu đãi theo ngày giúp khách hàng dễ chọn thời điểm xem phim.',
  },
  {
    label: 'Fan screening',
    title: 'Không gian check-in và quà tặng nhỏ',
    meta: '20:00 - Cuối tuần',
    description: 'Sự kiện dành cho cộng đồng yêu phim và các suất chiếu đặc biệt.',
  },
];

const trustPillars = [
  { icon: Clock3, title: 'Đặt vé nhanh', text: 'Luồng chọn phim, chọn ghế và thanh toán được tối ưu cho thao tác ngắn.' },
  { icon: ShieldCheck, title: 'Giữ ghế realtime', text: 'Ghế được giữ theo thời gian thực để hạn chế trùng đặt chỗ.' },
  { icon: Sparkles, title: 'Trải nghiệm điện ảnh', text: 'Thông tin phim, lịch chiếu và ưu đãi được trình bày rõ ràng.' },
];

export default function HomeShowcaseSections() {
  return (
    <div className="space-y-24">
      <section data-gsap-reveal className="gsap-card luxury-sheen relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(252,234,187,0.14),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 md:p-10 shadow-[0_25px_120px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-y-6 left-1/2 hidden w-px bg-white/8 lg:block" />
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-cinema-gold">
              Trải nghiệm đặt vé
            </Badge>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-5xl">
                Đặt vé nhanh cho những suất chiếu đang được quan tâm
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/55 md:text-base">
                BookMyScreen kết nối lịch chiếu, sơ đồ ghế, combo và thanh toán trong một luồng đặt vé rõ ràng.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((item) => (
                <div key={item.label} className="gsap-card rounded-[1.75rem] border border-white/8 bg-black/20 p-5 backdrop-blur-sm">
                  <div className="text-3xl font-black tracking-tight text-white">{item.value}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-white/75">{item.label}</div>
                  <p className="mt-2 text-xs leading-5 text-white/40">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 self-start">
            {trustPillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="gsap-card rounded-[1.75rem] border border-white/8 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-cinema-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-gsap-reveal className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-10 bg-cinema-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-cinema-gold">Ưu đãi & tiện ích</span>
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
              Những lựa chọn giúp hoàn tất đơn đặt vé nhanh hơn
            </h2>
          </div>
          <Link
            href="/promotions"
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full border-white/10 bg-white/5 px-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-white/10')}
          >
            Mở trang khuyến mãi
          </Link>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {promoCards.map(({ icon: Icon, eyebrow, title, description, cta, href, accent }) => (
            <div key={title} className="gsap-card luxury-sheen group relative flex min-h-[25.5rem] overflow-hidden rounded-[2.25rem] border border-white/8 bg-card p-7 shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-90`} />
              <div className="absolute inset-x-6 bottom-0 h-px bg-white/10" />
              <div className="relative z-10 flex w-full flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-black/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/75">
                    {eyebrow}
                  </Badge>
                </div>
                <div className="mt-6 flex-1 space-y-3">
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white">{title}</h3>
                  <p className="text-sm leading-6 text-white/50">{description}</p>
                </div>
                <Link
                  href={href}
                  className={cn(buttonVariants({ variant: 'default' }), 'mt-8 h-12 min-w-0 self-start rounded-full bg-white px-5 text-[11px] font-bold uppercase leading-none tracking-[0.28em] text-black hover:bg-cinema-gold')}
                >
                  {cta}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-gsap-reveal className="space-y-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-cinema-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-cinema-gold">Sự kiện & chiến dịch</span>
          </div>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
            Lịch sự kiện nổi bật trong tuần
          </h2>
        </div>

        <div className="gsap-card luxury-sheen overflow-hidden rounded-[2.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(246,213,138,0.10),rgba(255,255,255,0.02)),var(--card)] p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full border border-cinema-gold/20 bg-cinema-gold/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cinema-gold">
              Đang mở đăng ký
            </Badge>
            <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
              Cập nhật theo tuần
            </Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {eventCards.map((item) => (
              <div key={item.title} className="gsap-card rounded-[1.75rem] border border-white/8 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-cinema-gold">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <h3 className="mt-4 text-lg font-bold uppercase tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">{item.meta}</p>
                <p className="mt-4 text-sm leading-6 text-white/45">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
