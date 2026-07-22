'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Wallet,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Film,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGetShowQuery } from '@/store/api/showAPI';
import { useCreateBookingMutation, useGetBookingDetailQuery, useCancelBookingMutation } from '@/store/api/bookingAPI';
import { useAppSelector } from '@/store/hooks';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Params for both flows
  const bookingId = searchParams.get('bookingId');
  const showId = searchParams.get('showId');
  const seatsParam = searchParams.get('seats');
  const selectedSeats = seatsParam ? seatsParam.split(',') : [];

  // API Hooks
  const { data: booking, isLoading: isBookingLoading, error: bookingError, refetch: refetchBooking } = useGetBookingDetailQuery(bookingId as string, {
    skip: !bookingId
  });

  const { data: show, isLoading: isShowLoading } = useGetShowQuery(showId as string, {
    skip: !showId || !!bookingId
  });

  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();
  const [cancelBooking] = useCancelBookingMutation();

  const { isAuthenticated, isLoading: isAuthLoading, user } = useAppSelector((state) => state.auth);
  const [paymentMethod, setPaymentMethod] = useState<'ZALOPAY' | 'MOMO' | 'ATM' | 'SEPAY'>('SEPAY');
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // QR Modal States
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Confirm Dialog States
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelAction, setCancelAction] = useState<'cancel-payment' | 'cancel-in-qr-modal'>('cancel-payment');
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Socket Real-time Seat Conflict Detection
  const socketRef = useRef<any>(null);
  const [seatsConflict, setSeatsConflict] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thực hiện thanh toán');
      router.push('/login');
      return;
    }
    setMounted(true);

    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      width: (Math.floor(Math.random() * 3) + 1) + 'px',
      height: (Math.floor(Math.random() * 3) + 1) + 'px',
      left: (Math.floor(Math.random() * 100)) + '%',
      top: (Math.floor(Math.random() * 100)) + '%',
      delay: (Math.random() * 5).toFixed(2) + 's',
      duration: (Math.floor(Math.random() * 10) + 10) + 's'
    }));
    setParticles(newParticles);
  }, [isAuthenticated, isAuthLoading, router]);

  // Socket connection for real-time seat updates
  useEffect(() => {
    if (!isAuthenticated || !booking) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socketRef.current = socket;

    const currentShowId = booking.showId || showId;
    if (!currentShowId) return;

    // Join the show room to listen to seat updates
    socket.emit('show:join', currentShowId);

    const handleSeatsUpdate = (data: any) => {
      if (!booking || !booking.seats) return;

      // Extract all booked seat IDs from other users
      const bookedSeatIds = (data.booked || [])
        .filter((b: any) => String(b.userId) !== String(user?.id))
        .map((b: any) => b.seatId);

      // Check if any of current booking's seats are now booked by others
      const conflictingSeats = booking.seats.filter((seat: any) =>
        bookedSeatIds.includes(seat.id)
      );

      if (conflictingSeats.length > 0) {
        const conflictLabels = conflictingSeats.map((s: any) => `${s.row}${s.column}`).join(', ');
        setSeatsConflict(conflictingSeats.map((s: any) => s.id));
        setConflictWarning(`Ghế ${conflictLabels} đã được người khác đặt! Vui lòng hủy và chọn lại!`);
        // Only show toast once per conflict
        if (seatsConflict.length === 0) {
          toast.error(`⚠️ Ghế ${conflictLabels} không còn trống!`, { duration: 10000 });
        }
      } else if (seatsConflict.length > 0) {
        // Clear conflict if no conflicting seats are found
        setSeatsConflict([]);
        setConflictWarning('');
      }
    };

    socket.on('show:seats-update', handleSeatsUpdate);

    return () => {
      socket.off('show:seats-update', handleSeatsUpdate);
      socket.emit('show:leave', currentShowId);
    };
  }, [isAuthenticated, booking, user?.id, showId, seatsConflict.length]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thực hiện thanh toán');
      router.push('/login');
      return;
    }
    setMounted(true);

    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      width: (Math.floor(Math.random() * 3) + 1) + 'px',
      height: (Math.floor(Math.random() * 3) + 1) + 'px',
      left: (Math.floor(Math.random() * 100)) + '%',
      top: (Math.floor(Math.random() * 100)) + '%',
      delay: (Math.random() * 5).toFixed(2) + 's',
      duration: (Math.floor(Math.random() * 10) + 10) + 's'
    }));
    setParticles(newParticles);
  }, [isAuthenticated, isAuthLoading, router]);

  // Case B: Auto-create pending booking if they came from quick booking flow
  const creationAttempted = useRef(false);

  useEffect(() => {
    if (!bookingId && showId && selectedSeats.length > 0 && show?.screen?.seats && !creationAttempted.current) {
      creationAttempted.current = true;
      const autoCreatePendingBooking = async () => {
        try {
          const seatIds = selectedSeats.map(label => {
            const row = label.charAt(0);
            const col = parseInt(label.substring(1));
            const seat = show.screen?.seats?.find((s: any) => s.row === row && s.column === col);
            return seat?.id;
          }).filter(Boolean) as string[];

          if (seatIds.length === 0) {
            toast.error('Thông tin ghế chọn không hợp lệ');
            return;
          }

          const res = await createBooking({
            showId,
            seatIds,
            paymentMethod: 'SEPAY'
          }).unwrap();

          if (res.success && res.booking?.id) {
            router.replace(`/payment?bookingId=${res.booking.id}`);
          } else {
            toast.error('Lỗi khởi tạo giữ ghế');
          }
        } catch (err: any) {
          const msg = err?.data?.message || 'Một hoặc nhiều ghế đã có người chọn hoặc giữ';
          if (msg.includes('chờ thanh toán')) {
            toast.error(msg, {
              action: {
                label: 'Xem vé',
                onClick: () => router.push('/bookings')
              },
              duration: 10000
            });
          } else {
            toast.error(msg);
          }
          setTimeout(() => {
            router.replace(`/booking/${showId}`);
          }, 2500);
        }
      };
      autoCreatePendingBooking();
    }
  }, [bookingId, showId, seatsParam, show, createBooking, router]);

  // Booking Expiry Countdown Timer
  useEffect(() => {
    if (!booking) return;
    const createdAt = new Date((booking as any).bookingDateTime || booking.createdAt).getTime();
    const expiresAt = createdAt + 10 * 60 * 1000;

    const leftInitial = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setTimeLeft(leftInitial);

    if (leftInitial <= 0) {
      toast.warning('Đơn hàng đã hết thời gian chờ thanh toán!');
      cancelBooking(booking.id);
      setTimeout(() => {
        router.replace(`/booking/${booking.showId}`);
      }, 2000);
      return;
    }

    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        toast.warning('Đơn hàng đã hết thời gian chờ thanh toán!');
        cancelBooking(booking.id);
        setTimeout(() => {
          router.replace(`/booking/${booking.showId}`);
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking, router, cancelBooking]);

  useEffect(() => {
    let interval: any;

    if (showQrModal && bookingId) {
      const socket = getSocket();

      const handleBookingConfirmed = (data: any) => {
        if ((!data?.bookingId || data?.bookingId === bookingId) && data?.status === 'CONFIRMED') {
          if (interval) clearInterval(interval);
          setShowQrModal(false);
          toast.success("Thanh toán thành công! Vé của bạn đã được xác nhận.");
          router.push(`/bookings?status=success&bookingId=${bookingId}`);
        }
      };

      if (socket) {
        if (!socket.connected) socket.connect();
        socket.on('booking:updated', handleBookingConfirmed);
      }

      interval = setInterval(async () => {
        try {
          const res = await refetchBooking();
          if (res.data?.status === 'CONFIRMED') {
            if (socket) socket.off('booking:updated', handleBookingConfirmed);
            clearInterval(interval);
            setShowQrModal(false);
            toast.success("Thanh toán thành công! Vé của bạn đã được xác nhận.");
            router.push(`/bookings?status=success&bookingId=${bookingId}`);
          }
        } catch (e) {
          console.error("Payment status check error:", e);
        }
      }, 10000);

      return () => {
        if (socket) socket.off('booking:updated', handleBookingConfirmed);
        if (interval) clearInterval(interval);
      };
    }
  }, [showQrModal, bookingId, refetchBooking, router]);

  // Handle already CONFIRMED booking immediately
  useEffect(() => {
    if (booking && booking.status === 'CONFIRMED') {
      toast.success('Đơn hàng này đã được thanh toán thành công!');
      router.replace(`/bookings?status=success&bookingId=${booking.id}`);
    }
  }, [booking, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleConfirmCancel = async () => {
    if (!activeBooking) return;

    // Prevent multiple calls
    if (isConfirmingCancel || isRedirecting) {
      return;
    }

    setIsConfirmingCancel(true);
    try {
      const res = await cancelBooking(activeBooking.id).unwrap();
      console.log("Cancel booking success:", res);

      // Set redirecting first to block all interactions
      setIsRedirecting(true);

      // Close dialogs
      setShowCancelDialog(false);
      setShowQrModal(false);

      toast.success("✅ Đã hủy giao dịch và giải phóng ghế thành công!");

      // Redirect after short delay
      setTimeout(() => {
        router.replace(`/booking/${activeShow?.id || activeBooking.showId || ''}`);
      }, 1000);
    } catch (err: any) {
      console.error("Cancel booking error:", err);
      toast.error("❌ Lỗi: " + (err?.data?.message || err?.message || "Không thể hủy giao dịch"));
      setIsRedirecting(false);
    } finally {
      setIsConfirmingCancel(false);
    }
  };

  const handlePayment = async () => {
    // Prevent multiple calls
    if (isRedirecting || isConfirmingCancel || isProcessingPayment) {
      return;
    }

    if (!booking) {
      toast.error('Không tìm thấy thông tin vé thanh toán');
      return;
    }

    if (seatsConflict.length > 0) {
      toast.error('❌ Không thể thanh toán! Một hoặc nhiều ghế của bạn đã được người khác đặt. Vui lòng hủy và chọn lại ghế mới.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1/web';

      const paymentRes = await fetch(`${apiUrl}/payment/sepay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: booking.total, bookingId: booking.id }),
        credentials: 'include'
      });
      const paymentData = await paymentRes.json();

      if (paymentData.success) {
        const transactionCode = paymentData.transactionCode || booking.id;
        const bankId = process.env.NEXT_PUBLIC_SEPAY_BANK_ID || 'ACB';
        const accountNo = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NO || '7380071';
        const accountName = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NAME || 'TRAN ANH TRUNG';
        const qrUrl = paymentData.qrImageUrl || `https://qr.sepay.vn/img?bank=${bankId}&acc=${accountNo}&template=compact&amount=${booking.total}&des=${encodeURIComponent(transactionCode)}&holder=${encodeURIComponent(accountName)}`;

        setPaymentQrUrl(qrUrl);
        setPaymentUrl(`${apiUrl}/payment/sepay/checkout/${booking.id}`);
        setShowQrModal(true);
        setIsProcessingPayment(false);
        toast.info("Vui lòng quét mã QR và giữ nguyên trang này để hệ thống cập nhật trạng thái.");
      } else {
        toast.error(paymentData.message || 'Lỗi khởi tạo cổng thanh toán');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi kết nối với cổng thanh toán');
      setIsProcessingPayment(false);
    }
  };

  const isPageLoading = isBookingLoading || isAuthLoading || isShowLoading || isCreatingBooking || !bookingId;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!isRedirecting && (bookingError || (!bookingId && !showId) || (bookingId && !booking) || (booking && ['CANCELLED', 'EXPIRED'].includes(booking.status)))) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-tight text-white text-center">Đơn hàng không tồn tại, đã bị hủy hoặc hết hạn thanh toán</h2>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl">Quay về trang chủ</Button>
      </div>
    );
  }

  // Active loaded booking details
  const activeBooking = booking!;
  const activeShow = activeBooking.show;
  const activeMovie = activeShow?.movie;
  const activeTheater = activeShow?.theater;
  const seatLabels = activeBooking.seats?.map(s => `${s.row}${s.column}`) || [];

  console.log("PAYMENT activeBooking:", activeBooking);
  console.log("PAYMENT activeMovie:", activeMovie);
  console.log("PAYMENT poster:", activeMovie?.poster);


  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050507] py-20 px-6">
      <div
        className="absolute inset-0 z-0 scale-110 animate-subtle-zoom"
        style={{
          backgroundImage: `url(${activeMovie?.poster?.source || '/login-bg.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.2) blur(10px)'
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#050507]/80 to-[#050507]" />

      <button
        onClick={() => {
          if (showCancelDialog || isRedirecting || isConfirmingCancel) return;
          console.log("Click top-left cancel button");
          setCancelAction('cancel-payment');
          setShowCancelDialog(true);
        }}
        disabled={showCancelDialog || isRedirecting || isConfirmingCancel}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-primary/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-white/40 disabled:hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Hủy & Quay lại</span>
      </button>

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {mounted && particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-white/20 rounded-full blur-xl animate-float-particle"
            style={{
              width: p.width,
              height: p.height,
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration
            }}
          />
        ))}
      </div>

      <div className="relative z-20 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 bg-[#1E1910]/64 backdrop-blur-[40px] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cinema-gold/5 pointer-events-none" />
            <div className="relative space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-primary rounded-full" /><span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Phương thức thanh toán</span></div>
                <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">Xác nhận thanh toán</h1>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'SEPAY', name: 'Thanh toán Quét mã QR (Hỗ trợ 40+ Ngân Hàng, MoMo, ZaloPay)', icon: Wallet, color: 'text-cinema-gold' }
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`relative p-6 rounded-3xl border transition-all cursor-pointer flex flex-col gap-4 group ${paymentMethod === m.id ? 'bg-white/10 border-primary shadow-[0_0_20px_rgba(246,213,138,0.22)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${paymentMethod === m.id ? m.color : 'text-white/20'}`}>
                      <m.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${paymentMethod === m.id ? 'text-white' : 'text-white/40'}`}>{m.name}</span>
                    {paymentMethod === m.id && <div className="absolute top-4 right-4"><ShieldCheck className="w-4 h-4 text-primary" /></div>}
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-white/40"><ShieldCheck className="w-5 h-5 text-green-500" /> <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Thông tin của bạn được bảo mật tuyệt đối với hệ thống mã hóa 256-bit chuẩn quốc tế.</span></div>
              </div>

              {seatsConflict.length > 0 && (
                <div className="p-6 rounded-3xl bg-destructive/20 border border-destructive/50 space-y-3 animate-pulse">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-destructive">Cảnh báo: Ghế không còn trống!</span>
                      <span className="text-[10px] text-white/60">{conflictWarning}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessingPayment || seatsConflict.length > 0 || isRedirecting || isConfirmingCancel}
                className={`w-full h-16 rounded-[2rem] font-bold uppercase tracking-widest text-xs gap-4 transition-all ${seatsConflict.length > 0
                  ? 'bg-gray-600 text-white/60 cursor-not-allowed opacity-50'
                  : isRedirecting || isConfirmingCancel
                    ? 'bg-gray-600 text-white/60 cursor-not-allowed opacity-50'
                    : 'bg-primary text-white shadow-[0_15px_40px_rgba(246,213,138,0.28)] hover:shadow-[0_20px_50px_rgba(246,213,138,0.42)] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
              >
                {isProcessingPayment ? (
                  <Loader2 className="animate-spin h-6 w-6 text-white" />
                ) : seatsConflict.length > 0 ? (
                  <>
                    ❌ Không thể thanh toán <AlertTriangle className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Thanh toán an toàn ngay <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 bg-[#1E1910]/72 backdrop-blur-[40px] p-8 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-br from-cinema-gold/5 via-transparent to-primary/5 pointer-events-none" />
            <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Tóm tắt đơn hàng</span>
                <Badge className="bg-primary/20 text-primary border-primary/20 animate-pulse">{formatTime(timeLeft)}</Badge>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-24 h-32 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-[#1E1910] flex items-center justify-center">
                  {activeMovie?.poster?.source ? (
                    <img src={activeMovie.poster.source} className="w-full h-full object-cover" alt={activeMovie.title} />
                  ) : (
                    <Film className="h-8 w-8 text-white/20 animate-pulse" />
                  )}
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-bold uppercase tracking-tight text-white leading-tight">{activeMovie?.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] font-bold uppercase">{activeShow?.format}</Badge>
                    <Badge variant="outline" className="bg-primary/20 border-primary/20 text-primary text-[9px] font-bold uppercase">{activeMovie?.certification}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-white/40 font-bold uppercase"><MapPin className="w-4 h-4 text-cinema-gold" /> Rạp</div>
                  <span className="text-white font-bold uppercase">{activeTheater?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-white/40 font-bold uppercase"><Calendar className="w-4 h-4 text-cinema-gold" /> Ngày</div>
                  <span className="text-white font-bold uppercase">
                    {activeShow?.startTime ? new Date(activeShow.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-white/40 font-bold uppercase"><Clock className="w-4 h-4 text-primary" /> Suất chiếu</div>
                  <span className="text-white font-bold uppercase">
                    {activeShow?.startTime ? new Date(activeShow.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-white/40 font-bold uppercase"><Ticket className="w-4 h-4 text-primary" /> Ghế chọn</div>
                  <span className="text-primary font-bold uppercase">{seatLabels.join(', ')}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Số tiền cần trả</span>
                  <span className="text-3xl font-bold text-white uppercase tracking-tighter">{activeBooking.total.toLocaleString()} VNĐ</span>
                </div>
              </div>

              {/* Timer Info Box */}
              <div className="pt-6 border-t border-white/10">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Thông tin thời gian</span>
                  </div>
                  <div className="space-y-1.5 text-[9px] text-white/70">
                    <p>⏱️ Bạn có <span className="text-primary font-bold">{formatTime(timeLeft)}</span> để hoàn tất thanh toán</p>
                    <p>🔓 Hết thời gian sẽ <span className="font-bold">tự động giải phóng ghế</span> cho người khác</p>
                    <p>↩️ Chuyển hướng về trang <span className="font-bold">chọn ghế</span> để bạn thực hiện thanh toán lại</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/5 flex items-center gap-5 group hover:bg-white/10 transition-all cursor-help">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Sparkles className="w-6 h-6" /></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Tiết kiệm hơn với ưu đãi</span>
              <span className="text-[9px] font-medium text-white/40 uppercase tracking-widest mt-1">Đăng nhập thành viên để nhận điểm thưởng</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Premium Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#14110B]/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md overflow-hidden rounded-[3rem] border border-white/10 bg-[#1E1910]/72 backdrop-blur-[50px] p-8 md:p-10 shadow-[0_0_100px_rgba(246,213,138,0.22)] text-center space-y-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cinema-gold/10 pointer-events-none" />

            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Quét mã thanh toán</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest">
                Sử dụng App {paymentMethod === 'ATM' ? 'Ngân hàng / VNPay' : 'Ví ZaloPay'} để quét mã
              </p>
            </div>

            {/* QR Code Container */}
            <div className="relative mx-auto w-60 h-60 bg-white p-4 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 group hover:scale-[1.02] transition-transform duration-300">
              <img src={paymentQrUrl} alt="QR Code" className="w-full h-full object-contain" />
            </div>

            {/* Status & Loader */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-ping" />
                Đang chờ bạn quét mã...
              </div>

              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full animate-pulse">
                <span>Hết hạn sau:</span>
                <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
              </div>

              <p className="text-[9px] text-white/30 uppercase tracking-wider">Hệ thống tự động chuyển hướng khi thanh toán thành công</p>

              {/* Timer Explanation */}
              <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">💡 Lưu ý thời gian:</p>
                <ul className="text-[8px] text-white/50 space-y-1 ml-2">
                  <li>• Bạn có <span className="text-primary font-bold">{formatTime(timeLeft)}</span> để quét mã thanh toán</li>
                  <li>• Nếu hết hạn: ghế sẽ tự động <span className="font-bold">giải phóng</span> cho người khác</li>
                  <li>• Bạn sẽ được <span className="font-bold">chuyển về trang chọn ghế</span> để thực hiện lại</li>
                  <li>• Giao dịch <span className="text-primary font-bold">không được hủy có thể bị hoàn tiền</span></li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  if (isRedirecting || isConfirmingCancel || showCancelDialog) return;
                  console.log("Click cancel booking button in modal");
                  // Close QR modal first, then show cancel dialog
                  setShowQrModal(false);
                  setCancelAction('cancel-in-qr-modal');
                  setShowCancelDialog(true);
                }}
                disabled={isRedirecting || isConfirmingCancel || showCancelDialog}
                variant="outline"
                className="w-full h-12 rounded-2xl border-destructive/20 hover:border-destructive hover:bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:border-destructive/10 disabled:hover:bg-transparent"
              >
                Hủy thanh toán & Chọn lại ghế
              </Button>

              <Button
                onClick={() => {
                  if (isRedirecting || isConfirmingCancel) return;
                  setShowQrModal(false);
                }}
                disabled={isRedirecting || isConfirmingCancel}
                className="w-full h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đóng cổng quét QR (Không hủy ghế)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md bg-black/90 border border-white/10 backdrop-blur-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white">
                Xác nhận hủy đơn hàng
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-white/70 leading-relaxed">
              {cancelAction === 'cancel-payment'
                ? "Nếu hủy lúc này, bạn sẽ quay lại sơ đồ chọn ghế. Các ghế hiện tại sẽ được giải phóng trong 7 phút để những người khác có thể chọn."
                : "Nếu hủy, giao dịch thanh toán sẽ bị hủy và toàn bộ ghế sẽ được giải phóng ngay lập tức. Bạn có thể quay lại chọn ghế khác."}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Sẽ quay lại trang:</p>
            <p className="text-sm font-bold text-white">📍 Sơ đồ chọn ghế</p>
            <p className="text-[10px] text-white/50 mt-2">💡 Các ghế bạn chọn sẽ được tự động giải phóng để bạn thực hiện thanh toán lại.</p>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                if (isConfirmingCancel || isRedirecting) return;
                setShowCancelDialog(false);
              }}
              disabled={isConfirmingCancel || isRedirecting}
              variant="outline"
              className="flex-1 h-12 rounded-lg border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quay lại
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={isConfirmingCancel || isRedirecting}
              className="flex-1 h-12 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-bold uppercase tracking-wider transition-all gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirmingCancel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050507] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
