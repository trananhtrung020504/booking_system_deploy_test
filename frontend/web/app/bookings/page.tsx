'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, Calendar, Clock, MapPin, Ticket, ChevronRight, CheckCircle2, XCircle, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useGetUserBookingsQuery, useCancelBookingMutation } from '@/store/api/bookingAPI';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import type { BookingStatus } from '@/types';

const statusConfig: Record<BookingStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  CONFIRMED: { label: 'Đã xác nhận', icon: CheckCircle2, className: 'text-green-400 bg-green-400/10 border-green-400/30' },
  PENDING: { label: 'Chờ thanh toán', icon: AlertCircle, className: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  CANCELLED: { label: 'Đã hủy', icon: XCircle, className: 'text-red-400 bg-red-400/10 border-red-400/30' },
  EXPIRED: { label: 'Hết hạn', icon: XCircle, className: 'text-muted-foreground bg-muted border-border' },
};

function BookingCountdown({ createdAt }: { createdAt: string }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const expiresAt = new Date(createdAt).getTime() + 10 * 60 * 1000;
    const updateTime = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(left);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (timeLeft <= 0) return <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Hết hạn</span>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <span className="text-amber-400 text-[10px] font-bold animate-pulse tracking-wide uppercase">
      Còn lại: {mins}:{secs < 10 ? '0' : ''}{secs}
    </span>
  );
}

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const { isAuthenticated, isLoading: isAuthLoading } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [selectedQrBooking, setSelectedQrBooking] = useState<any | null>(null);

  const { data, isLoading, refetch } = useGetUserBookingsQuery({
    page,
    limit: 10,
    status: activeTab === 'ALL' ? undefined : activeTab
  });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const bookingIdParam = searchParams.get('bookingId');

  const handleTabChange = (tab: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED') => {
    setActiveTab(tab);
    setPage(1);
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (statusParam === 'expired_paid') {
      toast.warning('Thanh toán thành công nhưng đã quá hạn giữ ghế 10 phút. Hệ thống không thể xuất vé. Vui lòng liên hệ CSKH để được hỗ trợ hoàn tiền hoặc đổi vé!', {
        duration: 8000
      });
      router.replace('/bookings');
    } else if (statusParam === 'success' && bookingIdParam) {
      // After payment redirect, poll the booking status.
      // The SePay webhook handles the actual CONFIRMED transition server-side.
      // We only need to refetch to reflect the latest status in the UI.
      const pollStatus = async () => {
        toast.info('Đang kiểm tra trạng thái thanh toán...', { duration: 3000 });

        // Poll a few times to give webhook time to process
        let attempts = 0;
        const maxAttempts = 6;
        const pollInterval = 2000; // 2 seconds

        const poll = async () => {
          attempts++;
          const result = await refetch();
          const booking = result.data?.bookings?.find((b: any) => b.id === bookingIdParam);

          if (booking?.status === 'CONFIRMED') {
            toast.success('Thanh toán thành công! Vé của bạn đã được xác nhận.');
            router.replace('/bookings');
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            // Webhook may arrive later via Socket.IO — the Chatbot listener handles that
            toast.info('Hệ thống đang xử lý thanh toán. Vé sẽ tự động cập nhật khi hoàn tất.', { duration: 5000 });
            router.replace('/bookings');
          }
        };

        await poll();
      };

      pollStatus();
    }
  }, [statusParam, bookingIdParam, refetch, router]);

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId).unwrap();
      toast.success('Đã hủy vé thành công');
      setConfirmCancelId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể hủy vé');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-1/3 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Ticket className="h-7 w-7 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">Vé của tôi</h1>
      </div>

      {/* Premium Filter Tabs */}
      <div className="flex bg-white/[0.02] border border-white/5 rounded-2xl p-1 mb-8 gap-1 select-none backdrop-blur-md">
        {([
          { id: 'ALL', label: 'Tất cả' },
          { id: 'CONFIRMED', label: 'Đã xác nhận' },
          { id: 'PENDING', label: 'Chờ thanh toán' },
          { id: 'CANCELLED', label: 'Đã hủy' }
        ] as const).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${isActive
                  ? 'bg-gradient-to-r from-primary to-rose-400 text-white shadow-lg shadow-primary/20 scale-105 z-10'
                  : 'text-white/40 hover:text-white/85 hover:bg-white/[0.04]'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {data?.bookings && data.bookings.length > 0 ? (
        <div className="space-y-4">
          {data.bookings.map((booking, index) => {
            const show = booking.show;
            const isFuture = show ? new Date(show.startTime) > new Date() : false;

            let status = statusConfig[booking.status];
            if (booking.status === 'CONFIRMED' && !isFuture) {
              status = {
                label: 'Đã diễn ra',
                icon: CheckCircle2,
                className: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30'
              };
            }
            const StatusIcon = status.icon;
            const movie = show?.movie;
            const theater = show?.theater;

            return (
              <Card
                key={booking.id}
                className="overflow-hidden animate-fade-in bg-card/80 border-border/50"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                    {/* Poster */}
                    {movie?.poster?.source && (
                      <div
                        className="relative w-full sm:w-[130px] shrink-0 overflow-hidden rounded-xl shadow-xl border border-white/5 cursor-pointer group"
                        onClick={() => movie?.id && router.push(`/movies/${movie.id}`)}
                      >
                        <img
                          src={movie.poster.source}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover group-hover:scale-110 group-hover:blur-[2px] transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-bold text-white uppercase tracking-widest px-3 py-1.5 border border-white/40 bg-black/40 backdrop-blur-sm rounded-full">Xem phim</span>
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-semibold text-lg cursor-pointer hover:text-primary hover:underline transition-colors"
                            onClick={() => movie?.id && router.push(`/movies/${movie.id}`)}
                          >
                            {movie?.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Mã vé: {booking.bookingRef}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                            Thời gian đặt: {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge className={`gap-1 ${status.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                          {booking.status === 'PENDING' && (
                            <BookingCountdown createdAt={booking.createdAt} />
                          )}
                        </div>
                      </div>

                      {show && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground bg-white/5 rounded-xl p-3.5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span className="font-medium text-white/80">{format(new Date(show.startTime), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium text-white/80">{format(new Date(show.startTime), 'HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-cinema-gold shrink-0" />
                            <span className="font-medium text-white/80 truncate">{theater?.name} • <span className="text-white/50">{show.screen?.name}</span></span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {booking.seats?.map((seat: any) => (
                              <Badge key={seat.id || seat} variant="outline" className="text-[10px] font-bold bg-white/5 border-white/10 uppercase tracking-widest text-primary/90">
                                {typeof seat === 'object' ? `${seat.row}${seat.column}` : seat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <span className="font-bold text-xl text-white tracking-tighter">
                          {booking.total.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Status Message Side */}
                    <div className="flex-1">
                      {confirmCancelId === booking.id ? (
                        <p className="text-xs font-bold uppercase tracking-widest text-destructive animate-pulse flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Bạn chắc chắn muốn hủy?
                        </p>
                      ) : booking.status === 'PENDING' ? (
                        <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 font-medium flex items-center gap-2 w-fit">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>Tự động hủy nếu không thanh toán trong 10 phút.</span>
                        </div>
                      ) : booking.status === 'CONFIRMED' && isFuture ? (
                        <div className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 font-medium flex items-center gap-2 w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>Thanh toán thành công. Vui lòng chuẩn bị vé QR khi vào rạp.</span>
                        </div>
                      ) : booking.status === 'CONFIRMED' && !isFuture ? (
                        <div className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 rounded-xl p-2.5 font-medium flex items-center gap-2 w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span>Suất chiếu đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ!</span>
                        </div>
                      ) : booking.status === 'CANCELLED' ? (
                        <div className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-2.5 font-medium flex items-center gap-2 w-fit">
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                          <span>Giao dịch đã bị hủy. Chỗ ngồi đã được giải phóng.</span>
                        </div>
                      ) : booking.status === 'EXPIRED' ? (
                        <div className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-2.5 font-medium flex items-center gap-2 w-fit">
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                          <span>Giao dịch quá hạn thanh toán và đã bị hệ thống tự động hủy.</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Buttons side */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {confirmCancelId === booking.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs font-bold rounded-xl uppercase tracking-wider"
                            onClick={() => handleCancel(booking.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Xác nhận hủy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs rounded-xl uppercase tracking-wider"
                            onClick={() => setConfirmCancelId(null)}
                            disabled={isCancelling}
                          >
                            Quay lại
                          </Button>
                        </>
                      ) : (
                        <>
                          {booking.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="text-[10px] bg-primary hover:bg-primary/90 text-white font-bold rounded-xl uppercase tracking-widest px-4"
                                onClick={() => router.push(`/payment?bookingId=${booking.id}`)}
                              >
                                Thanh toán ngay
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] text-white/60 hover:text-white border-white/10 hover:bg-white/5 rounded-xl uppercase tracking-widest px-4"
                                onClick={() => setConfirmCancelId(booking.id)}
                              >
                                Hủy vé
                              </Button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl uppercase tracking-widest px-4 gap-1.5"
                                onClick={() => setSelectedQrBooking(booking)}
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                Xem vé QR
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {page} / {data?.pagination?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (data?.pagination?.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-sm">
          <Ticket className="h-16 w-16 mx-auto text-white/10 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold mb-2">Không tìm thấy vé</h3>
          <p className="text-white/40 mb-6 text-sm">
            {activeTab === 'ALL' ? 'Bạn chưa thực hiện bất kỳ giao dịch đặt vé nào.' :
              activeTab === 'CONFIRMED' ? 'Bạn không có vé nào ở trạng thái đã xác nhận.' :
                activeTab === 'PENDING' ? 'Bạn không có vé nào đang chờ thanh toán.' :
                  'Bạn không có vé nào ở trạng thái đã hủy.'}
          </p>
          {activeTab === 'ALL' && (
            <Button onClick={() => router.push('/movies')} className="rounded-xl">
              <Film className="h-4 w-4 mr-2" />
              Khám phá phim ngay
            </Button>
          )}
        </div>
      )}

      {/* QR Ticket Modal */}
      {selectedQrBooking && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedQrBooking(null)}
        >
          <div
            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cinema-gold/5 pointer-events-none" />

            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">{selectedQrBooking.show?.movie?.title}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {selectedQrBooking.show?.theater?.name} • {selectedQrBooking.show?.screen?.name}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-inner max-w-[220px] mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedQrBooking.bookingRef)}`}
                alt="Ticket QR Code"
                className="w-full h-auto object-contain"
              />
              <span className="text-[10px] font-bold text-zinc-900 mt-3 tracking-widest uppercase">{selectedQrBooking.bookingRef}</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-left text-xs bg-white/5 border border-white/5 rounded-2xl p-4">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Thời gian</span>
                  <span className="font-semibold text-white">
                    {format(new Date(selectedQrBooking.show?.startTime), 'HH:mm • dd/MM')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Ghế</span>
                  <span className="font-semibold text-white">
                    {selectedQrBooking.seats?.map((s: any) => typeof s === 'object' ? `${s.row}${s.column}` : s).join(', ')}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Vui lòng xuất trình mã QR này tại quầy soát vé để quét check-in trước khi vào phòng chiếu.
              </p>

              <Button
                onClick={() => setSelectedQrBooking(null)}
                className="w-full h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest border border-white/5"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <BookingsContent />
    </Suspense>
  );
}
