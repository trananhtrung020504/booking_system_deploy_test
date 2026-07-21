'use client';

import { useState } from 'react';
import { X, Loader2, Calendar, MapPin, User, Ticket, Coffee, CreditCard, AlertCircle } from 'lucide-react';
import { useGetAdminBookingDetailQuery, useCancelAdminBookingMutation } from '@/store/api/adminBookingAPI';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface BookingDetailModalProps {
  bookingId: string;
  onClose: () => void;
}

export default function BookingDetailModal({ bookingId, onClose }: BookingDetailModalProps) {
  const { data: booking, isLoading } = useGetAdminBookingDetailQuery(bookingId);
  const [cancelBooking, { isLoading: isCancelling }] = useCancelAdminBookingMutation();
  const [reason, setReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const getStatusLabel = (status: string) => {
    if (status === 'CONFIRMED') return 'Đã thanh toán';
    if (status === 'PENDING') return 'Chờ thanh toán';
    if (status === 'EXPIRED') return 'Hết hạn';
    return 'Đã hủy';
  };

  const handleCancel = async () => {
    try {
      await cancelBooking({ id: bookingId, data: { reason } }).unwrap();
      toast.success('Hủy đặt vé thành công!');
      onClose();
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi hủy vé.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Chi tiết đặt vé
            </h3>
            {booking && (
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Ref ID: <span className="text-primary font-bold">{booking.bookingRef}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[450px] text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span>Đang tải thông tin đặt vé...</span>
          </div>
        ) : !booking ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Không tìm thấy thông tin đặt vé
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-6 space-y-6">
            {/* Main Info Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Customer and Show details */}
              <div className="space-y-5">
                {/* Customer Card */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3 text-primary" />
                    Khách hàng
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{booking.user.name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{booking.user.email}</div>
                    {booking.user.phone && (
                      <div className="text-xs text-muted-foreground mt-0.5">SĐT: {booking.user.phone}</div>
                    )}
                  </div>
                </div>

                {/* Show Details */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-primary" />
                    Suất chiếu
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{booking.show?.movie?.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {booking.show?.theater?.name} ({booking.show?.theater?.city})
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Giờ chiếu: <span className="font-bold text-foreground">{format(new Date(booking.show?.startTime || ''), 'HH:mm - dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    {booking.show?.screen && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Phòng chiếu: <span className="font-bold text-foreground">{booking.show.screen.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Seats, Snack Combos, Payment */}
              <div className="space-y-5">
                {/* Seats and Combos */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Ticket className="h-3 w-3 text-primary" />
                    Ghế & Đồ ăn nước uống
                  </div>
                  <div className="space-y-3">
                    {/* Seats list */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Ghế đã đặt:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {booking.seats?.map(s => (
                          <span key={s.id} className="bg-background px-2.5 py-1 rounded border border-border text-xs font-mono font-bold text-foreground">
                            {s.row}{s.column}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Combos list */}
                    {booking.combos && booking.combos.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Coffee className="h-3.5 w-3.5 text-primary" /> Combo bắp nước:
                        </div>
                        <div className="space-y-1">
                          {booking.combos.map(c => (
                            <div key={c.id} className="text-xs flex justify-between text-foreground">
                              <span>{c.combo.name} x {c.quantity}</span>
                              <span className="font-bold">{formatCurrency(c.combo.price * c.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-primary" />
                    Chi tiết thanh toán
                  </div>
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Giá vé phim:</span>
                      <span>{formatCurrency(booking.ticketPrice)}</span>
                    </div>
                    {booking.discountAmount > 0 && (
                      <div className="flex justify-between text-green-500 font-medium">
                        <span>Giảm giá voucher:</span>
                        <span>-{formatCurrency(booking.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border/50 pt-1.5 text-sm font-bold text-foreground">
                      <span>Tổng số tiền:</span>
                      <span className="text-cinema-gold font-bold">{formatCurrency(booking.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Block */}
            <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap gap-6 items-center justify-between text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Phương thức:</span>{' '}
                <span className="font-bold text-foreground">{booking.paymentMethod}</span>
              </div>
              {booking.transaction && (
                <>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Mã giao dịch:</span>{' '}
                    <span className="font-mono font-bold text-foreground">{booking.transaction.transactionCode}</span>
                  </div>
                  {booking.transaction.paidAt && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Thời gian chuyển khoản:</span>{' '}
                      <span className="font-bold text-foreground">
                        {format(new Date(booking.transaction.paidAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-green-500/20 text-green-500 border-green-500/30'
                    : booking.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    : 'bg-destructive/20 text-destructive border-destructive/30'
                }`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>
            </div>

            {/* Cancel Action Section */}
            {booking.status !== 'CANCELLED' && booking.status !== 'EXPIRED' && (
              <div className="pt-4 border-t border-border space-y-4">
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2.5 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl hover:bg-destructive hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2"
                  >
                    Hủy đặt vé này
                  </button>
                ) : (
                  <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-xl space-y-3 animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">Xác nhận hủy đặt vé?</div>
                        <div className="text-xs opacity-80 mt-0.5">Hành động này không thể hoàn tác. Ghế đã chọn sẽ ngay lập tức được giải phóng.</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lý do hủy (tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Nhập lý do khách hàng yêu cầu hủy..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-destructive text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1 py-2 bg-muted border border-border text-foreground hover:bg-muted/80 rounded-xl transition-all font-bold text-xs"
                      >
                        Bỏ qua
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="flex-1 py-2 bg-destructive text-white hover:bg-destructive/95 disabled:opacity-50 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-1"
                      >
                        {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Xác nhận hủy vé'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
