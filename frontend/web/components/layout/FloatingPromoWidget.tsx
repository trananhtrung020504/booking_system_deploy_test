'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gift, Sparkles, Ticket, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const promoSlides = [
  {
    icon: Gift,
    eyebrow: 'Voucher mô phỏng',
    title: 'Giảm 20% cho suất chiếu buổi tối',
    description: 'Khối mini này giúp website có cảm giác luôn đang chạy chiến dịch.',
    href: '/promotions',
    action: 'Xem ưu đãi',
  },
  {
    icon: Ticket,
    eyebrow: 'Combo nổi bật',
    title: 'Đặt 2 vé tặng ưu đãi bắp nước',
    description: 'Bạn có thể giữ UI này và nối backend combo campaign sau.',
    href: '/movies?status=now-showing',
    action: 'Đặt vé',
  },
  {
    icon: Sparkles,
    eyebrow: 'Gợi ý nâng cấp',
    title: 'Mở bán sớm cho phim hot cuối tuần',
    description: 'Một chỗ rất phù hợp để cắm realtime campaign sau này.',
    href: '/schedule',
    action: 'Xem lịch',
  },
];

export default function FloatingPromoWidget() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPromoIndex((current) => (current + 1) % promoSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setVisible(true);
  }, [pathname]);

  if (!visible || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const promo = promoSlides[promoIndex];
  const Icon = promo.icon;

  return (
    <div className="fixed bottom-5 right-5 z-[120] hidden w-[320px] xl:block">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d15]/94 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,234,187,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.14),transparent_40%)]" />
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/50 transition-colors hover:text-white"
          aria-label="Đóng khuyến mãi nổi"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cinema-gold">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cinema-gold">{promo.eyebrow}</p>
              <h3 className="mt-1 text-sm font-bold uppercase tracking-tight text-white">{promo.title}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/50">{promo.description}</p>
          <Link
            href={promo.href}
            className={cn(buttonVariants({ variant: 'default' }), 'mt-5 h-11 w-full rounded-full bg-white text-[10px] font-bold uppercase tracking-[0.28em] text-black hover:bg-cinema-gold')}
          >
            {promo.action}
          </Link>
        </div>
      </div>
    </div>
  );
}
