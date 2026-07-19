'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, Radio, Bot, Ticket, Clock3, ShieldCheck, X, ArrowRight, MessageSquareText } from 'lucide-react';

const storageKey = 'rophim_home_experience_guide_dismissed';

const GUIDE_TEXT = {
  badge: 'Trải nghiệm nên thử',
  heroTitle: 'Website này thú vị nhất khi bạn thử realtime bằng 2 tài khoản',
  heroDescription: 'Mở cùng một phim hoặc cùng một suất chiếu trên 2 tài khoản khác nhau để quan sát luồng chọn ghế, giữ ghế, khóa ghế và cập nhật thông báo theo thời gian thực.',
  reopen: 'Xem hướng dẫn',
  openSchedule: 'Mở lịch chiếu',
  closeAria: 'Đóng hướng dẫn trải nghiệm',
  modalBadge: 'Hướng dẫn trải nghiệm dự án',
  modalTitle: 'Đọc nhanh 1 phút trước khi khám phá',
  modalDescription: 'Đây không chỉ là giao diện đặt vé. Dự án hiện có realtime ghế, luồng giữ ghế khi thanh toán, cập nhật trạng thái booking và chatbot hỗ trợ tra cứu trực tiếp.',
  realtimeTitle: 'Cách test realtime ghế',
  chatbotTitle: 'Chatbot làm được gì',
  bookingGuideTitle: 'Cách nhắn để đặt vé nhanh',
  methodOne: 'Cách 1',
  methodTwo: 'Cách 2',
  startMovies: 'Bắt đầu chọn phim',
  viewSchedule: 'Xem lịch chiếu',
  closeAndTry: 'Đóng và trải nghiệm',
};

const realtimeFlow = [
  'Đăng nhập 2 tài khoản khác nhau và mở cùng 1 suất chiếu để xem đồng bộ ghế theo thời gian thực.',
  'Khi tài khoản A đang chọn ghế, tài khoản B sẽ thấy ghế đó nhấp nháy và trạng thái thay đổi gần như ngay lập tức.',
  'Nếu một bên giữ ghế hoặc hoàn tất thanh toán trước, phía còn lại sẽ nhận cập nhật mới và không thể tiếp tục lấy ghế đó.',
];

const chatbotCapabilities = [
  'Tra phim đang chiếu hoặc sắp chiếu theo nhu cầu người dùng.',
  'Xem chi tiết phim, thời lượng, phân loại tuổi và các suất chiếu sắp tới.',
  'Tra lịch chiếu theo phim, theo rạp hoặc theo ngày.',
  'Đặt vé trực tiếp bằng chatbot khi người dùng nhắn rõ tên phim, hoặc xin gợi ý phim theo thể loại rồi tiếp tục nhắn đặt phim đó.',
  'Chatbot sẽ xác nhận phim hợp lệ, mở luồng chọn rạp, suất chiếu, ghế và thanh toán ngay trong khung chat.',
  'Xem voucher đang hoạt động và lịch sử vé đã đặt khi người dùng đã đăng nhập.',
  'Chatbot vẫn ghi nhớ ngữ cảnh gần nhất để hiểu các câu tiếp theo như "đặt phim này", "xem lịch phim đó" hoặc "đặt luôn".',
];

const bookingExamples = [
  'Nhắn trực tiếp tên phim như: "Tôi muốn đặt phim Mai" hoặc "Đặt vé phim Đảo Độc Đắc".',
  'Nếu chưa biết xem gì, hãy nhắn: "Gợi ý phim kinh dị". Sau đó bạn có thể tiếp tục bằng các câu như "Đặt phim này" hoặc "Cho tôi suất đẹp nhất".',
];

const highlightItems = [
  {
    icon: Radio,
    title: 'Realtime seat sync',
    description: 'Các người xem cùng một suất chiếu được đồng bộ trạng thái ghế, người đang xem và ghế đang chọn.',
  },
  {
    icon: Ticket,
    title: 'Giữ ghế trong lúc thanh toán',
    description: 'Khi tạo booking, hệ thống khóa tạm ghế trong phiên thanh toán để tránh trùng chỗ.',
  },
  {
    icon: Clock3,
    title: 'Tự giải phóng ghế',
    description: 'Booking chờ thanh toán sẽ tự hết hạn sau khoảng 10 phút và ghế được trả lại cho hệ thống.',
  },
  {
    icon: Bot,
    title: 'Chatbot hỗ trợ nhanh',
    description: 'Chatbot có thể tra phim đang chiếu, phim sắp chiếu, chi tiết phim, lịch chiếu, voucher và vé đã đặt.',
  },
  {
    icon: MessageSquareText,
    title: 'Lưu lịch sử hội thoại',
    description: 'Cuộc trò chuyện với chatbot được lưu lại để người dùng có thể mở lại và tiếp tục hỏi.',
  },
  {
    icon: ShieldCheck,
    title: 'QR vé và lịch sử đặt vé',
    description: 'Người dùng có thể xem vé đã mua, trạng thái booking và mở QR ticket ở khu vực vé của tôi.',
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
            <Link 
              href="/schedule" 
              className={cn(buttonVariants({ variant: "default" }), "rounded-full bg-white text-black hover:bg-cinema-gold text-[10px] font-bold uppercase tracking-[0.28em]")}
            >
              {GUIDE_TEXT.openSchedule}
            </Link>
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
                  <Link
                    href="/movies?status=now-showing"
                    className={cn(buttonVariants({ variant: "default" }), "h-12 rounded-full bg-white px-6 text-black hover:bg-cinema-gold md:px-7 inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.28em]")}
                  >
                    {GUIDE_TEXT.startMovies}
                  </Link>
                  <Link 
                    href="/schedule" 
                    className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-full border-white/10 bg-white/5 px-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-white/10 md:px-7 inline-flex items-center justify-center gap-2")}
                  >
                    {GUIDE_TEXT.viewSchedule}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
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
