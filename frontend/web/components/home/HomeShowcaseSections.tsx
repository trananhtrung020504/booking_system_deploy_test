'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, Ticket, Popcorn, CalendarDays, Flame, ArrowRight, Clock3, Gift, Trophy, ShieldCheck } from 'lucide-react';

const quickStats = [
  { value: '20+', label: 'Phim đang mở bán', note: 'Cập nhật liên tục theo tuần' },
  { value: '120+', label: 'Suất chiếu mỗi ngày', note: 'Phủ từ sáng tới khuya' },
  { value: '2', label: 'Cụm rạp hoạt động', note: 'Sẵn sàng mở rộng tiếp' },
  { value: '4.8/5', label: 'Mức yêu thích', note: 'Trải nghiệm đặt vé mượt mà' },
];

const promoCards = [
  {
    icon: Gift,
    eyebrow: 'Voucher tuần này',
    title: 'Ưu đãi đặt vé online',
    description: 'Giảm trực tiếp cho đơn đặt vé và tạo cảm giác hệ thống luôn có campaign đang chạy.',
    cta: 'Xem khuyến mãi',
    href: '/promotions',
    accent: 'from-rose-500/25 via-rose-500/10 to-transparent',
  },
  {
    icon: Popcorn,
    eyebrow: 'Combo nổi bật',
    title: 'Bắp nước đồng bộ với suất chiếu',
    description: 'Khu vực quảng bá combo giúp trang chủ giàu chất cinema hơn thay vì chỉ liệt kê phim.',
    cta: 'Đặt vé ngay',
    href: '/movies?status=now-showing',
    accent: 'from-amber-300/25 via-amber-300/10 to-transparent',
  },
  {
    icon: Trophy,
    eyebrow: 'Thành viên',
    title: 'Tích điểm và mở khóa hạng',
    description: 'UI loyalty có thể làm trước bằng mock data rồi nối logic cộng điểm ở backend sau.',
    cta: 'Xem hồ sơ',
    href: '/profile',
    accent: 'from-sky-400/25 via-sky-400/10 to-transparent',
  },
];

const eventCards = [
  {
    label: 'Đêm chiếu sớm',
    title: 'Suất sneak show cho phim hot cuối tuần',
    meta: '19:30 • Thứ 6',
    description: 'Một block event riêng sẽ làm trang chủ trông giống website thương mại thật hơn rất nhiều.',
  },
  {
    label: 'Thứ 3 vui vẻ',
    title: 'Khung giờ đồng giá cho nhóm bạn',
    meta: 'Cả ngày • Thứ 3',
    description: 'Dùng để quảng bá campaign trong tuần trước khi bạn quyết định có cần backend campaign hay không.',
  },
  {
    label: 'Fan screening',
    title: 'Không gian check-in và quà tặng nhỏ',
    meta: '20:00 • Cuối tuần',
    description: 'Rất hợp để tạo chất "sự kiện" và tăng cảm giác sinh động cho website local demo.',
  },
];

const trustPillars = [
  { icon: Clock3, title: 'Đặt vé nhanh', text: 'Flow ngắn, CTA rõ, cảm giác mua vé mạch lạc hơn.' },
  { icon: ShieldCheck, title: 'Giữ ghế realtime', text: 'Nhấn mạnh lợi thế hệ thống hiện tại của bạn.' },
  { icon: Sparkles, title: 'Visual đậm chất rạp', text: 'Thêm chiều sâu thị giác mà chưa cần API mới.' },
];

export default function HomeShowcaseSections() {
  return (
    <div className="space-y-24">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 md:p-10 shadow-[0_25px_120px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-y-6 left-1/2 hidden w-px bg-white/8 lg:block" />
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            <Badge className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-rose-200">
              Điểm nhấn giao diện mới
            </Badge>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-5xl">
                Trang chủ nên vừa bán vé vừa kể câu chuyện điện ảnh
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/55 md:text-base">
                Mình thêm các lớp nội dung quảng bá, chỉ số nhanh và sự kiện để website không còn cảm giác chỉ là danh sách phim kèm form đặt vé.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-[1.75rem] border border-white/8 bg-black/20 p-5 backdrop-blur-sm">
                  <div className="text-3xl font-black tracking-tight text-white">{item.value}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-white/75">{item.label}</div>
                  <p className="mt-2 text-xs leading-5 text-white/40">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 self-start">
            {trustPillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-[1.75rem] border border-white/8 bg-white/5 p-5 backdrop-blur-xl">
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

      <section className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-10 bg-cinema-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-cinema-gold">Khu vực quảng bá</span>
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
              Những khối UI nên có để site nhìn đầy đặn hơn
            </h2>
          </div>
          <Link
            href="/promotions"
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full border-white/10 bg-white/5 px-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-white/10')}
          >
            Mở trang khuyến mãi
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {promoCards.map(({ icon: Icon, eyebrow, title, description, cta, href, accent }) => (
            <div key={title} className="group relative overflow-hidden rounded-[2.25rem] border border-white/8 bg-[#101018] p-7 shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-90`} />
              <div className="absolute inset-x-6 bottom-0 h-px bg-white/10" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-black/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/75">
                    {eyebrow}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white">{title}</h3>
                  <p className="text-sm leading-6 text-white/50">{description}</p>
                </div>
                <Link
                  href={href}
                  className={cn(buttonVariants({ variant: 'default' }), 'h-12 rounded-full bg-white text-[11px] font-bold uppercase tracking-[0.28em] text-black hover:bg-cinema-gold')}
                >
                  {cta}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-sky-400">Sự kiện & chiến dịch</span>
          </div>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
            Các card nội dung khiến dự án bớt cảm giác "bài tập local"
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(255,255,255,0.02)),#0d0d14] p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-sky-200">
                Kịch bản marketing mẫu
              </Badge>
              <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
                Có thể nối API sau
              </Badge>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {eventCards.map((item) => (
                <div key={item.title} className="rounded-[1.75rem] border border-white/8 bg-black/20 p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-200">
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

          <div className="rounded-[2.5rem] border border-white/8 bg-[#0d0d14] p-8">
            <div className="flex items-center gap-3 text-cinema-gold">
              <Flame className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.32em]">Gợi ý bổ sung tiếp</span>
            </div>
            <div className="mt-6 space-y-5">
              {[
                'Promo bar chạy ngang dưới header',
                'Membership card trong hồ sơ người dùng',
                'Countdown campaign ở trang promotions',
                'Banner mini cho lịch chiếu và rạp',
                'Social proof như "đang có 48 người xem"',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 p-4">
                  <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
