'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Radio, Bot, Ticket, Clock3, ShieldCheck, X, ArrowRight, MessageSquareText } from 'lucide-react';

const storageKey = 'rophim_home_experience_guide_dismissed';

const GUIDE_TEXT = {
  badge: '\u0054r\u1ea3i nghi\u1ec7m n\u00ean th\u1eed',
  heroTitle: '\u0057ebsite n\u00e0y th\u00fa v\u1ecb nh\u1ea5t khi b\u1ea1n th\u1eed realtime b\u1eb1ng 2 t\u00e0i kho\u1ea3n',
  heroDescription: 'M\u1edf c\u00f9ng m\u1ed9t phim ho\u1eb7c c\u00f9ng m\u1ed9t su\u1ea5t chi\u1ebfu tr\u00ean 2 t\u00e0i kho\u1ea3n kh\u00e1c nhau \u0111\u1ec3 quan s\u00e1t lu\u1ed3ng ch\u1ecdn gh\u1ebf, gi\u1eef gh\u1ebf, kh\u00f3a gh\u1ebf v\u00e0 c\u1eadp nh\u1eadt th\u00f4ng b\u00e1o theo th\u1eddi gian th\u1ef1c.',
  reopen: '\u0058em h\u01b0\u1edbng d\u1eabn',
  openSchedule: 'M\u1edf l\u1ecbch chi\u1ebfu',
  closeAria: '\u0110\u00f3ng h\u01b0\u1edbng d\u1eabn tr\u1ea3i nghi\u1ec7m',
  modalBadge: '\u0048\u01b0\u1edbng d\u1eabn tr\u1ea3i nghi\u1ec7m d\u1ef1 \u00e1n',
  modalTitle: '\u0110\u1ecdc nhanh 1 ph\u00fat tr\u01b0\u1edbc khi kh\u00e1m ph\u00e1',
  modalDescription: '\u0110\u00e2y kh\u00f4ng ch\u1ec9 l\u00e0 giao di\u1ec7n \u0111\u1eb7t v\u00e9. D\u1ef1 \u00e1n hi\u1ec7n c\u00f3 realtime gh\u1ebf, lu\u1ed3ng gi\u1eef gh\u1ebf khi thanh to\u00e1n, c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i booking v\u00e0 chatbot h\u1ed7 tr\u1ee3 tra c\u1ee9u tr\u1ef1c ti\u1ebfp.',
  realtimeTitle: '\u0043\u00e1ch test realtime gh\u1ebf',
  chatbotTitle: '\u0043hatbot l\u00e0m \u0111\u01b0\u1ee3c g\u00ec',
  bookingGuideTitle: '\u0043\u00e1ch nh\u1eafn \u0111\u1ec3 \u0111\u1eb7t v\u00e9 nhanh',
  methodOne: '\u0043\u00e1ch 1',
  methodTwo: '\u0043\u00e1ch 2',
  startMovies: '\u0042\u1eaft \u0111\u1ea7u ch\u1ecdn phim',
  viewSchedule: '\u0058em l\u1ecbch chi\u1ebfu',
  closeAndTry: '\u0110\u00f3ng v\u00e0 tr\u1ea3i nghi\u1ec7m',
};

const realtimeFlow = [
  '\u0110\u0103ng nh\u1eadp 2 t\u00e0i kho\u1ea3n kh\u00e1c nhau v\u00e0 m\u1edf c\u00f9ng 1 su\u1ea5t chi\u1ebfu \u0111\u1ec3 xem \u0111\u1ed3ng b\u1ed9 gh\u1ebf theo th\u1eddi gian th\u1ef1c.',
  'Khi t\u00e0i kho\u1ea3n A \u0111ang ch\u1ecdn gh\u1ebf, t\u00e0i kho\u1ea3n B s\u1ebd th\u1ea5y gh\u1ebf \u0111\u00f3 nh\u1ea5p nh\u00e1y v\u00e0 tr\u1ea1ng th\u00e1i thay \u0111\u1ed5i g\u1ea7n nh\u01b0 ngay l\u1eadp t\u1ee9c.',
  'N\u1ebfu m\u1ed9t b\u00ean gi\u1eef gh\u1ebf ho\u1eb7c ho\u00e0n t\u1ea5t thanh to\u00e1n tr\u01b0\u1edbc, ph\u00eda c\u00f2n l\u1ea1i s\u1ebd nh\u1eadn c\u1eadp nh\u1eadt m\u1edbi v\u00e0 kh\u00f4ng th\u1ec3 ti\u1ebfp t\u1ee5c l\u1ea5y gh\u1ebf \u0111\u00f3.',
];

const chatbotCapabilities = [
  'Tra phim \u0111ang chi\u1ebfu ho\u1eb7c s\u1eafp chi\u1ebfu theo nhu c\u1ea7u ng\u01b0\u1eddi d\u00f9ng.',
  'Xem chi ti\u1ebft phim, th\u1eddi l\u01b0\u1ee3ng, ph\u00e2n lo\u1ea1i tu\u1ed5i v\u00e0 c\u00e1c su\u1ea5t chi\u1ebfu s\u1eafp t\u1edbi.',
  'Tra l\u1ecbch chi\u1ebfu theo phim, theo r\u1ea1p ho\u1eb7c theo ng\u00e0y.',
  '\u0110\u1eb7t v\u00e9 tr\u1ef1c ti\u1ebfp b\u1eb1ng chatbot khi ng\u01b0\u1eddi d\u00f9ng nh\u1eafn r\u00f5 t\u00ean phim, ho\u1eb7c xin g\u1ee3i \u00fd phim theo th\u1ec3 lo\u1ea1i r\u1ed3i ti\u1ebfp t\u1ee5c nh\u1eafn \u0111\u1eb7t phim \u0111\u00f3.',
  'Chatbot s\u1ebd x\u00e1c nh\u1eadn phim h\u1ee3p l\u1ec7, m\u1edf lu\u1ed3ng ch\u1ecdn r\u1ea1p, su\u1ea5t chi\u1ebfu, gh\u1ebf v\u00e0 thanh to\u00e1n ngay trong khung chat.',
  'Xem voucher \u0111ang ho\u1ea1t \u0111\u1ed9ng v\u00e0 l\u1ecbch s\u1eed v\u00e9 \u0111\u00e3 \u0111\u1eb7t khi ng\u01b0\u1eddi d\u00f9ng \u0111\u00e3 \u0111\u0103ng nh\u1eadp.',
  'Chatbot v\u1eabn ghi nh\u1edb ng\u1eef c\u1ea3nh g\u1ea7n nh\u1ea5t \u0111\u1ec3 hi\u1ec3u c\u00e1c c\u00e2u ti\u1ebfp theo nh\u01b0 "\u0111\u1eb7t phim n\u00e0y", "xem l\u1ecbch phim \u0111\u00f3" ho\u1eb7c "\u0111\u1eb7t lu\u00f4n".',
];

const bookingExamples = [
  'Nh\u1eafn tr\u1ef1c ti\u1ebfp t\u00ean phim nh\u01b0: "T\u00f4i mu\u1ed1n \u0111\u1eb7t phim Mai" ho\u1eb7c "\u0110\u1eb7t v\u00e9 phim \u0110\u1ea3o \u0110\u1ed9c \u0110\u1eafc".',
  'N\u1ebfu ch\u01b0a bi\u1ebft xem g\u00ec, h\u00e3y nh\u1eafn: "G\u1ee3i \u00fd phim kinh d\u1ecb". Sau \u0111\u00f3 b\u1ea1n c\u00f3 th\u1ec3 ti\u1ebfp t\u1ee5c b\u1eb1ng c\u00e1c c\u00e2u nh\u01b0 "\u0110\u1eb7t phim n\u00e0y" ho\u1eb7c "Cho t\u00f4i su\u1ea5t \u0111\u1eb9p nh\u1ea5t".',
];

const highlightItems = [
  {
    icon: Radio,
    title: 'Realtime seat sync',
    description: 'C\u00e1c ng\u01b0\u1eddi xem c\u00f9ng m\u1ed9t su\u1ea5t chi\u1ebfu \u0111\u01b0\u1ee3c \u0111\u1ed3ng b\u1ed9 tr\u1ea1ng th\u00e1i gh\u1ebf, ng\u01b0\u1eddi \u0111ang xem v\u00e0 gh\u1ebf \u0111ang ch\u1ecdn.',
  },
  {
    icon: Ticket,
    title: 'Gi\u1eef gh\u1ebf trong l\u00fac thanh to\u00e1n',
    description: 'Khi t\u1ea1o booking, h\u1ec7 th\u1ed1ng kh\u00f3a t\u1ea1m gh\u1ebf trong phi\u00ean thanh to\u00e1n \u0111\u1ec3 tr\u00e1nh tr\u00f9ng ch\u1ed7.',
  },
  {
    icon: Clock3,
    title: 'T\u1ef1 gi\u1ea3i ph\u00f3ng gh\u1ebf',
    description: 'Booking ch\u1edd thanh to\u00e1n s\u1ebd t\u1ef1 h\u1ebft h\u1ea1n sau kho\u1ea3ng 10 ph\u00fat v\u00e0 gh\u1ebf \u0111\u01b0\u1ee3c tr\u1ea3 l\u1ea1i cho h\u1ec7 th\u1ed1ng.',
  },
  {
    icon: Bot,
    title: 'Chatbot h\u1ed7 tr\u1ee3 nhanh',
    description: 'Chatbot c\u00f3 th\u1ec3 tra phim \u0111ang chi\u1ebfu, phim s\u1eafp chi\u1ebfu, chi ti\u1ebft phim, l\u1ecbch chi\u1ebfu, voucher v\u00e0 v\u00e9 \u0111\u00e3 \u0111\u1eb7t.',
  },
  {
    icon: MessageSquareText,
    title: 'L\u01b0u l\u1ecbch s\u1eed h\u1ed9i tho\u1ea1i',
    description: 'Cu\u1ed9c tr\u00f2 chuy\u1ec7n v\u1edbi chatbot \u0111\u01b0\u1ee3c l\u01b0u l\u1ea1i \u0111\u1ec3 ng\u01b0\u1eddi d\u00f9ng c\u00f3 th\u1ec3 m\u1edf l\u1ea1i v\u00e0 ti\u1ebfp t\u1ee5c h\u1ecfi.',
  },
  {
    icon: ShieldCheck,
    title: 'QR v\u00e9 v\u00e0 l\u1ecbch s\u1eed \u0111\u1eb7t v\u00e9',
    description: 'Ng\u01b0\u1eddi d\u00f9ng c\u00f3 th\u1ec3 xem v\u00e9 \u0111\u00e3 mua, tr\u1ea1ng th\u00e1i booking v\u00e0 m\u1edf QR ticket \u1edf khu v\u1ef1c v\u00e9 c\u1ee7a t\u00f4i.',
  },
];

export default function HomeExperienceGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(storageKey);
    setIsOpen(!dismissed);
    setHasHydrated(true);
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem(storageKey, '1');
    setIsOpen(false);
  };

  const handleReopen = () => {
    setIsOpen(true);
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(252,234,187,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.14),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 md:p-8 shadow-[0_25px_100px_rgba(0,0,0,0.32)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge className="rounded-full border border-cinema-gold/20 bg-cinema-gold/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-cinema-gold">
              {GUIDE_TEXT.badge}
            </Badge>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
              {GUIDE_TEXT.heroTitle}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-white/55">
              {GUIDE_TEXT.heroDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleReopen} variant="outline" className="rounded-full border-white/10 bg-white/5 px-5 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-white/10">
              {GUIDE_TEXT.reopen}
            </Button>
            <Button asChild className="rounded-full bg-white text-black hover:bg-cinema-gold">
              <Link href="/schedule" className="text-[10px] font-bold uppercase tracking-[0.28em]">
                {GUIDE_TEXT.openSchedule}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md">
          <div className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0f] shadow-[0_0_120px_rgba(0,0,0,0.65)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,234,187,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_30%)]" />
            <button
              onClick={handleDismiss}
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:text-white"
              aria-label={GUIDE_TEXT.closeAria}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 max-h-[88vh] overflow-y-auto px-6 py-8 md:px-10 md:py-10">
              <div className="space-y-8">
                <div className="space-y-4 pr-12">
                  <Badge className="rounded-full border border-primary/25 bg-primary/12 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                    {GUIDE_TEXT.modalBadge}
                  </Badge>
                  <h2 className="text-3xl font-bold uppercase tracking-tight text-white md:text-5xl">
                    {GUIDE_TEXT.modalTitle}
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-white/55 md:text-base">
                    {GUIDE_TEXT.modalDescription}
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 md:p-7">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-cinema-gold" />
                      <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-white">
                        {GUIDE_TEXT.realtimeTitle}
                      </h3>
                    </div>
                    <div className="mt-5 space-y-4">
                      {realtimeFlow.map((item, index) => (
                        <div key={item} className="flex gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-6 text-white/60">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(255,255,255,0.02)),#0f1017] p-6 md:p-7">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-sky-300" />
                      <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-white">
                        {GUIDE_TEXT.chatbotTitle}
                      </h3>
                    </div>
                    <div className="mt-5 space-y-3 text-sm leading-6 text-white/60">
                      {chatbotCapabilities.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-sky-400/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.03))] p-6">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="h-5 w-5 text-sky-300" />
                    <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-white">
                      {GUIDE_TEXT.bookingGuideTitle}
                    </h3>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-white/60">
                      <p className="font-bold uppercase tracking-[0.16em] text-white">{GUIDE_TEXT.methodOne}</p>
                      <p className="mt-2">{bookingExamples[0]}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-white/60">
                      <p className="font-bold uppercase tracking-[0.16em] text-white">{GUIDE_TEXT.methodTwo}</p>
                      <p className="mt-2">{bookingExamples[1]}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {highlightItems.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="rounded-[1.75rem] border border-white/8 bg-white/4 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-cinema-gold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-white">{title}</h4>
                      <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-white/8 pt-6">
                  <Button asChild className="h-12 rounded-full bg-white px-6 text-black hover:bg-cinema-gold md:px-7">
                    <Link
                      href="/movies?status=now-showing"
                      className="inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.28em]"
                    >
                      {GUIDE_TEXT.startMovies}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-full border-white/10 bg-white/5 px-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-white/10 md:px-7"
                  >
                    <Link href="/schedule" className="inline-flex items-center justify-center gap-2">
                      {GUIDE_TEXT.viewSchedule}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button onClick={handleDismiss} variant="ghost" className="rounded-full text-[10px] font-bold uppercase tracking-[0.28em] text-white/65 hover:bg-white/5 hover:text-white">
                    {GUIDE_TEXT.closeAndTry}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
