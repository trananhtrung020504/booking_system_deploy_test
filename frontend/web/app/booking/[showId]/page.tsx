'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Clock, MapPin, Calendar, Monitor, ArrowLeft, Timer, Users, Ticket, CheckCircle2, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useGetShowQuery } from '@/store/api/showAPI';
import { useCreateBookingMutation, useApplyVoucherMutation, useGetUserBookingsQuery, useCancelBookingMutation } from '@/store/api/bookingAPI';
import { useGetCombosQuery } from '@/store/api/comboAPI';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSeatStatus, resetBookingFlow, setSelectedSeats, setHoldExpiresAt } from '@/store/slice/bookingSlice';
import { getSocket } from '@/lib/socket';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Seat, SeatsUpdatePayload, Combo } from '@/types';

export default function BookingPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppSelector((state) => state.auth);
  const { seatStatus } = useAppSelector((state) => state.bookingFlow);
  const socketRef = useRef<any>(null);

  const { data: show, isLoading: isShowLoading, refetch: refetchShow } = useGetShowQuery(showId);
  const { data: combos } = useGetCombosQuery();
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();
  const [applyVoucher, { isLoading: isApplyingVoucher }] = useApplyVoucherMutation();

  const { data: userBookingsData, refetch: refetchUserBookings } = useGetUserBookingsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [cancelBooking, { isLoading: isCancellingBooking }] = useCancelBookingMutation();

  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [othersSelecting, setOthersSelecting] = useState<Record<string, string[]>>({});
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [selectedCombos, setSelectedCombos] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthLoading, isAuthenticated, router]);

  // Tự động hủy và giải phóng ghế đang "Chờ thanh toán" cũ của suất này duy nhất 1 lần khi người dùng quay lại trang chọn ghế
  const hasCleanedUpRef = useRef(false);

  useEffect(() => {
    if (!userBookingsData || hasCleanedUpRef.current) return;

    const pending = userBookingsData.bookings?.find(
      (b: any) => b.showId === showId && b.status === 'PENDING'
    );

    if (pending && !isCancellingBooking) {
      hasCleanedUpRef.current = true;
      const autoRelease = async () => {
        try {
          await cancelBooking(pending.id).unwrap();
          refetchUserBookings();
          // Refetch show data to get fresh seat status after cancel
          await refetchShow();
          toast.info("Đơn hàng đang chờ thanh toán trước đó đã được tự động giải phóng để bạn chọn lại ghế mới!");
        } catch (err) {
          console.error("Auto release old booking failed:", err);
        }
      };
      autoRelease();
    } else if (userBookingsData) {
      // Đánh dấu đã dọn dẹp xong (hoặc không có gì để dọn dẹp) để không ảnh hưởng đến đơn hàng mới tạo
      hasCleanedUpRef.current = true;
    }
  }, [userBookingsData, showId, cancelBooking, refetchUserBookings, refetchShow, isCancellingBooking]);

  useEffect(() => {
    if (!isAuthenticated || !showId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socketRef.current = socket;

    socket.emit('show:join', showId);
    socket.on('show:seats-update', (data: any) => {
      dispatch(setSeatStatus(data));
      setViewerCount(data.viewerCount);

      if (data.selecting) {
        const map: Record<string, string[]> = {};
        data.selecting.forEach((item: any) => {
          if (String(item.userId) !== String(user?.id || '')) {
            map[item.userId] = item.seatIds;
          }
        });
        setOthersSelecting(map);
      }
    });
    
    socket.on('global:notification', (data: { message: string; type: string }) => {
      if (data.type === 'success') toast.success(data.message, { duration: 5000 });
      else toast.info(data.message);
    });

    socket.on('seats:expired', (data: { showId: string; seatIds: string[] }) => {
      if (data.showId === showId) {
        toast.warning('Hết thời gian giữ ghế!');
        dispatch(setHoldExpiresAt(null));
        setLocalSelectedSeats([]);
        dispatch(setSelectedSeats([]));
      }
    });

    return () => {
      socket.emit('show:leave', showId);
      socket.off('show:seats-update');
      socket.off('global:notification');
      socket.off('seats:expired');
      dispatch(resetBookingFlow());
    };
  }, [isAuthenticated, showId, dispatch, user?.id]);

  // Auto-refetch seat status periodically as backup for socket updates (handles timeout bookings & network issues)
  useEffect(() => {
    if (!isAuthenticated || !showId) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic show data refresh...');
      refetchShow();
    }, 30000); // Refetch every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, showId, refetchShow]);

  // Real-time alert khi ghế đang chọn cục bộ bị người khác giữ/đặt mất
  useEffect(() => {
    if (!show) return;
    const newlyHeldByOthers = localSelectedSeats.filter(id => 
      seatStatus?.booked.some(b => b.seatId === id) ||
      seatStatus?.held.some(h => h.seatId === id && String(h.userId) !== String(user?.id || '') && h.expiresAt > Date.now())
    );
    if (newlyHeldByOthers.length > 0) {
      const remainingSeats = localSelectedSeats.filter(id => !newlyHeldByOthers.includes(id));
      setLocalSelectedSeats(remainingSeats);
      
      socketRef.current?.emit('seats:selecting', { showId, seatIds: remainingSeats });
      
      const labels = newlyHeldByOthers.map(id => {
        const s = show?.screen?.seats?.find(st => st.id === id);
        return s ? `${s.row}${s.column}` : id;
      });
      
      toast.info(`Ghế ${labels.join(', ')} vừa mới được người khác đặt hoặc giữ thanh toán!`);
    }
  }, [seatStatus?.held, seatStatus?.booked, show, user?.id, localSelectedSeats, showId]);

  const allOthersSelecting = Object.values(othersSelecting).flat();

  const handleSeatClick = (seat: Seat) => {
    const booked = seatStatus?.booked.some(b => b.seatId === seat.id);
    const heldOther = seatStatus?.held.some(h => h.seatId === seat.id && h.userId !== user?.id && h.expiresAt > Date.now());
    if (booked || heldOther || !seat.isActive) return;

    const newSeats = localSelectedSeats.includes(seat.id) 
      ? localSelectedSeats.filter(id => id !== seat.id) 
      : localSelectedSeats.length >= 8 ? localSelectedSeats : [...localSelectedSeats, seat.id];
    
    setLocalSelectedSeats(newSeats);
    socketRef.current?.emit('seats:selecting', { showId, seatIds: newSeats });
  };

  const handleComboChange = (comboId: string, delta: number) => {
    setSelectedCombos(prev => {
      const current = prev[comboId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [comboId]: next };
    });
  };

  const calculateTotals = () => {
    let ticketTotal = 0;
    if (show?.priceMap) {
      ticketTotal = localSelectedSeats.reduce((sum, id) => {
        const s = show.screen?.seats?.find(x => x.id === id);
        return sum + (show.priceMap[s?.type || 'STANDARD'] || 0);
      }, 0);
    }

    let comboTotal = 0;
    if (combos) {
      Object.entries(selectedCombos).forEach(([id, qty]) => {
        const c = combos.find(x => x.id === id);
        if (c) comboTotal += c.price * qty;
      });
    }

    const baseTotal = ticketTotal + comboTotal;
    const finalTotal = Math.max(0, baseTotal - discount);
    
    return { ticketTotal, comboTotal, baseTotal, finalTotal };
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      const { baseTotal } = calculateTotals();
      const res = await applyVoucher({ code: voucherCode, amount: baseTotal }).unwrap();
      setDiscount(res.discount);
      setAppliedVoucher(voucherCode);
      toast.success(`Đã áp dụng mã giảm giá: -${res.discount.toLocaleString()}đ`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Mã giảm giá không hợp lệ');
      setDiscount(0);
      setAppliedVoucher(null);
    }
  };

  const handleBooking = async () => {
    try {
      const res = await createBooking({ 
        showId, 
        seatIds: localSelectedSeats, 
        paymentMethod: 'VNPAY',
        voucherCode: appliedVoucher || undefined,
        combos: Object.entries(selectedCombos).filter(([_, qty]) => qty > 0).map(([id, qty]) => ({ comboId: id, quantity: qty }))
      }).unwrap();

      if (res.success && res.booking?.id) {
        toast.success('Đang chuyển đến trang thanh toán...');
        router.push(`/payment?bookingId=${res.booking.id}`);
      } else {
        toast.error('Lỗi khởi tạo vé');
      }
    } catch (err: any) {
      const msg = err?.data?.message || 'Lỗi đặt vé';
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
    }
  };

  const renderSeatGrid = () => {
    if (!show?.screen?.seats) return null;
    const seatsByRow: Record<string, Seat[]> = {};
    show.screen.seats.forEach(s => {
      if (!seatsByRow[s.row]) seatsByRow[s.row] = [];
      seatsByRow[s.row].push(s);
    });

    return (
      <div className="space-y-6">
        <div className="relative mx-auto max-w-lg">
          <div className="h-2 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full" />
          <div className="h-8 bg-gradient-to-b from-primary/10 to-transparent rounded-b-3xl" />
          <p className="text-center text-xs text-muted-foreground -mt-2 flex items-center justify-center gap-1">
            <Monitor className="h-3 w-3" /> MÀN HÌNH
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-[9px] font-bold uppercase tracking-wider text-white/40 py-2 border-b border-white/5 w-full">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-secondary border" /> Trống</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-primary" /> Đang chọn</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-500 animate-pulse" /> Ai đó đang xem (Có thể tranh chọn)</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white/10 border border-cinema-gold animate-pulse" /> Đang thanh toán (Khóa tạm thời)</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white/5 opacity-30" /> Đã đặt</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-cinema-gold" /> VIP</div>
        </div>

        {localSelectedSeats.some(id => allOthersSelecting.includes(id)) && (
          <div className="w-full max-w-md mx-auto py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500/90 flex items-center gap-2 justify-center animate-pulse">
            <Users className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            <span>Có ghế bạn vừa chọn đang được khách hàng khác xem. Hãy nhanh tay thanh toán!</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-fit mx-auto flex flex-col items-center gap-1.5 pb-4">
            {Object.entries(seatsByRow).map(([row, seats]) => (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-6 text-center text-xs font-medium text-muted-foreground">{row}</span>
                {seats.map(seat => {
                  const booked = seatStatus?.booked.some(b => b.seatId === seat.id);
                  const heldOther = seatStatus?.held.some(h => h.seatId === seat.id && h.userId !== user?.id && h.expiresAt > Date.now());
                  const heldByMe = seatStatus?.held.some(h => h.seatId === seat.id && h.userId === user?.id && h.expiresAt > Date.now());
                  const selectingByOther = allOthersSelecting.includes(seat.id);
                  const selected = localSelectedSeats.includes(seat.id) || heldByMe;
                  
                  let cls = 'seat seat-available';
                  if (booked) cls = 'seat seat-booked';
                  else if (heldOther) cls = 'seat seat-held';
                  else if (selected) cls = 'seat seat-selected';
                  else if (selectingByOther) cls = 'seat seat-selecting-other';
                  
                  if (seat.type === 'VIP' && !booked) cls += ' seat-vip';
                  if (seat.type === 'SWEETBOX' && !booked) cls += ' seat-sweetbox';

                  return (
                    <button
                      key={seat.id}
                      className={cls}
                      onClick={() => handleSeatClick(seat)}
                      disabled={booked || heldOther}
                      title={selectingByOther ? 'Có người đang chọn ghế này' : ''}
                    >
                      {seat.column}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isShowLoading) return <div className="container p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!show) return <div className="container p-20 text-center">Không tìm thấy suất chiếu</div>;

  const currentSeats = localSelectedSeats;
  const { ticketTotal, comboTotal, baseTotal, finalTotal } = calculateTotals();

  return (
    <div className="relative min-h-screen">
      {show.movie?.poster?.source && (
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center opacity-10 blur-3xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${show.movie.poster.source})` }}
        />
      )}

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
            {show.movie?.poster?.source && <img src={show.movie.poster.source} className="w-12 h-18 rounded object-cover shadow-lg border-2 border-white/10" />}
            <div>
              <h1 className="text-xl font-bold">{show.movie?.title}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> {show.theater?.name} • {show.screen?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary animate-pulse" />
              <span>{viewerCount} người đang xem</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(show.startTime), 'HH:mm • dd/MM')}</span>
            </div>
          </div>
        </div>



        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="p-6 bg-card/70 backdrop-blur-sm rounded-3xl border shadow-xl">{renderSeatGrid()}</div>


            <div className="p-6 bg-card/70 backdrop-blur-sm rounded-3xl border shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Thêm bắp nước
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combos?.map(combo => (
                  <div key={combo.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {combo.image ? (
                        <img src={combo.image} className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center"><Ticket className="h-8 w-8 text-primary/40" /></div>
                      )}
                      <div>
                        <p className="font-bold">{combo.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{combo.description}</p>
                        <p className="text-sm font-bold text-primary mt-1">{combo.price.toLocaleString()}đ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-background/50 rounded-full p-1 px-3 border">
                      <button onClick={() => handleComboChange(combo.id, -1)} className="p-1 hover:text-primary transition-colors"><Minus className="h-4 w-4" /></button>
                      <span className="w-4 text-center font-bold">{selectedCombos[combo.id] || 0}</span>
                      <button onClick={() => handleComboChange(combo.id, 1)} className="p-1 hover:text-primary transition-colors"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-24 p-6 bg-card/80 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Tóm tắt đơn hàng
                </h3>
                
                {localSelectedSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 py-2">
                    {localSelectedSeats.map(id => {
                      const s = show.screen?.seats?.find(x => x.id === id);
                      return <Badge key={id} variant="secondary" className="px-3 py-1 font-bold bg-primary/20 text-primary border-primary/30">{s?.row}{s?.column}</Badge>;
                    })}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic text-center py-4">Vui lòng chọn ghế để tiếp tục</p>}
              </div>

              {currentSeats.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Mã giảm giá</p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nhập mã..." 
                        value={voucherCode} 
                        onChange={(e) => setVoucherCode(e.target.value)}
                        disabled={!!appliedVoucher || isApplyingVoucher}
                        className="bg-secondary/30 rounded-xl"
                      />
                      <Button 
                        variant={appliedVoucher ? "secondary" : "outline"}
                        onClick={handleApplyVoucher} 
                        disabled={!voucherCode || !!appliedVoucher || isApplyingVoucher}
                        className="rounded-xl"
                      >
                        {appliedVoucher ? 'OK' : 'Áp dụng'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiền vé</span>
                      <span>{ticketTotal.toLocaleString()}đ</span>
                    </div>
                    {comboTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bắp nước</span>
                        <span>{comboTotal.toLocaleString()}đ</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-green-500 font-bold">
                        <span>Giảm giá</span>
                        <span>-{discount.toLocaleString()}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-2">
                      <span className="font-bold text-lg">Tổng tiền</span>
                      <span className="text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(225,29,72,0.3)]">{finalTotal.toLocaleString()}đ</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/30" 
                      onClick={handleBooking} 
                      disabled={isCreatingBooking}
                    >
                      {isCreatingBooking ? 'Đang xử lý...' : 'Thanh toán ngay'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
