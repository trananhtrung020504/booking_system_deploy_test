'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, ChevronLeft, CreditCard, Loader2, MapPin, Radio, Sparkles, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetAvailableDatesQuery, useGetShowQuery, useGetShowsByMovieQuery } from '@/store/api/showAPI';
import { useCreateBookingMutation } from '@/store/api/bookingAPI';
import { useAppSelector } from '@/store/hooks';
import { connectSocket, getSocket } from '@/lib/socket';
import type { BookingFlowMovie, BookingFlowResponse, HeldSeat } from '@/types';

interface ChatbotBookingModalProps {
  open: boolean;
  flow: BookingFlowResponse | null;
  onClose: () => void;
  onPaymentReady: (payload: {
    message: string;
    qrImageUrl: string;
    checkoutBridgeUrl: string;
    bookingRef: string;
    amount: number;
    movieTitle: string;
  }) => Promise<void> | void;
}

type ModalStep = 'schedule' | 'seats' | 'payment';

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1/web';
const INITIAL_VISIBLE_DATES = 6;

const TEXT = {
  loginRequired: '\u0042\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u1eb7t v\u00e9 b\u1eb1ng chatbot.',
  chooseShowAndSeats: '\u0056ui l\u00f2ng ch\u1ecdn \u0111\u1ea7y \u0111\u1ee7 su\u1ea5t chi\u1ebfu v\u00e0 gh\u1ebf.',
  seatBooked: '\u0047h\u1ebf n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u1eb7t.',
  seatHeld: '\u0047h\u1ebf n\u00e0y \u0111ang \u0111\u01b0\u1ee3c ng\u01b0\u1eddi kh\u00e1c gi\u1eef.',
  paymentInitFailed: '\u004b\u0068\u00f4ng th\u1ec3 kh\u1edfi t\u1ea1o c\u1ed5ng thanh to\u00e1n.',
  paymentCreateFailed: '\u004b\u0068\u00f4ng th\u1ec3 t\u1ea1o \u0111\u01a1n \u0111\u1eb7t v\u00e9 b\u1eb1ng chatbot.',
  selectedShowFallback: '\u0053u\u1ea5t chi\u1ebfu \u0111\u00e3 ch\u1ecdn',
  bookingCreated: '\u0110\u00e3 t\u1ea1o \u0111\u01a1n gi\u1eef gh\u1ebf th\u00e0nh c\u00f4ng. QR thanh to\u00e1n \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1eedi v\u00e0o khung chat.',
  badge: '\u0110\u1eb7t v\u00e9 b\u1eb1ng chatbot',
  noPoster: '\u004e\u006f\u0020\u0050\u006f\u0073\u0074\u0065\u0072',
  durationPrefix: '\u0054h\u1eddi l\u01b0\u1ee3ng',
  durationSuffix: 'ph\u00fat. Ch\u1ecdn l\u1ecbch chi\u1ebfu v\u00e0 gh\u1ebf ngay trong khung n\u00e0y.',
  highlights: '\u0110i\u1ec3m n\u1ed5i b\u1eadt',
  highlightOne: 'Ch\u1ecdn r\u1ea1p, su\u1ea5t chi\u1ebfu v\u00e0 gh\u1ebf m\u00e0 kh\u00f4ng r\u1eddi c\u1eeda s\u1ed5 chat.',
  highlightTwo: 'Gh\u1ebf s\u1ebd ti\u1ebfp t\u1ee5c c\u1eadp nh\u1eadt realtime trong l\u00fac b\u1ea1n ch\u1ecdn.',
  highlightThree: 'Sau khi t\u1ea1o \u0111\u01a1n, chatbot g\u1eedi ngay QR thanh to\u00e1n v\u00e0o phi\u00ean chat.',
  step1: 'B\u01b0\u1edbc 1',
  step2: 'B\u01b0\u1edbc 2',
  step3: 'B\u01b0\u1edbc 3',
  scheduleTitle: 'Ch\u1ecdn l\u1ecbch chi\u1ebfu',
  seatsTitle: 'Ch\u1ecdn gh\u1ebf ng\u1ed3i',
  paymentTitle: 'X\u00e1c nh\u1eadn \u0111\u01a1n',
  chooseDate: 'Ch\u1ecdn ng\u00e0y',
  showAllDates: '\u0110ang hi\u1ec3n th\u1ecb to\u00e0n b\u1ed9 c\u00e1c ng\u00e0y c\u00f3 su\u1ea5t chi\u1ebfu.',
  showPreviewDates: (count: number) => `\u0110ang hi\u1ec3n th\u1ecb ${count} ng\u00e0y \u0111\u1ea7u ti\u00ean \u0111\u1ec3 b\u1ea1n ch\u1ecdn nhanh h\u01a1n.`,
  collapse: 'Thu g\u1ecdn',
  expand: 'Xem th\u00eam',
  chooseTheaterAndShow: 'Ch\u1ecdn r\u1ea1p v\u00e0 su\u1ea5t chi\u1ebfu',
  noShows: 'Ch\u01b0a c\u00f3 su\u1ea5t chi\u1ebfu ph\u00f9 h\u1ee3p cho ng\u00e0y n\u00e0y. B\u1ea1n th\u1eed \u0111\u1ed5i ng\u00e0y kh\u00e1c ho\u1eb7c quay l\u1ea1i ch\u1ecdn phim kh\u00e1c nh\u00e9.',
  continueSeats: 'Ti\u1ebfp t\u1ee5c ch\u1ecdn gh\u1ebf',
  realtimeStatus: 'Tr\u1ea1ng th\u00e1i realtime',
  viewersText: (count: number) => `\u0110ang c\u00f3 ${count} ng\u01b0\u1eddi xem c\u00f9ng su\u1ea5t chi\u1ebfu n\u00e0y.`,
  selectedSeatCount: (count: number) => `${count} gh\u1ebf \u0111\u00e3 ch\u1ecdn`,
  screenLabel: 'M\u00e0n h\u00ecnh r\u1ea1p chi\u1ebfu',
  emptySeat: 'Tr\u1ed1ng',
  selectingSeat: '\u0110ang ch\u1ecdn',
  heldByOther: 'Ng\u01b0\u1eddi kh\u00e1c gi\u1eef',
  bookedSeat: '\u0110\u00e3 \u0111\u1eb7t',
  continuePayment: 'Ti\u1ebfp t\u1ee5c thanh to\u00e1n',
  orderSummary: 'T\u00f3m t\u1eaft \u0111\u01a1n',
  movie: 'Phim',
  showtime: 'Su\u1ea5t chi\u1ebfu',
  seats: 'Gh\u1ebf',
  paymentMethod: 'Ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n',
  paymentMethodName: 'SEPAY QR',
  paymentMethodDesc: 'T\u1ea1o \u0111\u01a1n thanh to\u00e1n v\u00e0 g\u1eedi QR tr\u1ef1c ti\u1ebfp v\u1ec1 phi\u00ean chat hi\u1ec7n t\u1ea1i.',
  createOrderAndSendQr: 'T\u1ea1o \u0111\u01a1n v\u00e0 g\u1eedi QR v\u00e0o chat',
};

export default function ChatbotBookingModal({
  open,
  flow,
  onClose,
  onPaymentReady,
}: ChatbotBookingModalProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState<ModalStep>('schedule');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showAllDates, setShowAllDates] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [heldSeats, setHeldSeats] = useState<HeldSeat[]>([]);
  const [bookedSeats, setBookedSeats] = useState<{ seatId: string; userId?: string }[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [selectingSeatsMap, setSelectingSeatsMap] = useState<Record<string, string[]>>({});
  const [paymentMethod] = useState<'SEPAY'>('SEPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movie = flow?.movie as BookingFlowMovie | undefined;
  const movieId = movie?.id || '';

  const { data: availableDates } = useGetAvailableDatesQuery(movieId, {
    skip: !open || !movieId
  });

  const selectedDate = availableDates?.[selectedDateIndex];
  const visibleDates = showAllDates
    ? (availableDates || [])
    : (() => {
        const dates = availableDates || [];
        if (selectedDateIndex < INITIAL_VISIBLE_DATES) {
          return dates.slice(0, INITIAL_VISIBLE_DATES);
        }

        const selectedDateValue = dates[selectedDateIndex];
        const previewDates = dates.slice(0, INITIAL_VISIBLE_DATES - 1);
        return selectedDateValue ? [...previewDates, selectedDateValue] : previewDates;
      })();
  const canExpandDates = (availableDates?.length || 0) > INITIAL_VISIBLE_DATES;

  const { data: showsData } = useGetShowsByMovieQuery(
    {
      movieId,
      date: selectedDate
    },
    {
      skip: !open || !movieId || !selectedDate
    }
  );

  const {
    data: activeShow,
    isFetching: isShowLoading,
    refetch: refetchShow
  } = useGetShowQuery(selectedShowId as string, {
    skip: !open || !selectedShowId
  });

  const [createBooking] = useCreateBookingMutation();
  const enrichedShow = activeShow as typeof activeShow & {
    heldSeats?: HeldSeat[];
    bookedSeats?: { seatId: string; userId?: string }[];
  };

  useEffect(() => {
    if (!open) return;
    setStep('schedule');
    setSelectedDateIndex(0);
    setShowAllDates(false);
    setSelectedShowId(null);
    setSelectedSeats([]);
    setHeldSeats([]);
    setBookedSeats([]);
    setViewerCount(0);
    setSelectingSeatsMap({});
  }, [open, movieId]);

  useEffect(() => {
    if (!open || !availableDates?.length) return;
    if (selectedDateIndex >= availableDates.length) {
      setSelectedDateIndex(0);
    }
  }, [availableDates, open, selectedDateIndex]);

  useEffect(() => {
    if (!enrichedShow) return;
    setHeldSeats(enrichedShow.heldSeats || []);
    setBookedSeats(enrichedShow.bookedSeats || []);
  }, [enrichedShow]);

  useEffect(() => {
    if (!open || !selectedShowId) return;

    const socket = getSocket() || connectSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const joinRoom = () => {
      socket.emit('show:join', selectedShowId);
    };

    const handleSeatUpdate = (payload: any) => {
      if (payload.showId !== selectedShowId) return;
      setHeldSeats(payload.held || []);
      setBookedSeats(payload.booked || []);
      setViewerCount(payload.viewerCount || 0);

      const nextMap: Record<string, string[]> = {};
      (payload.selecting || []).forEach((item: any) => {
        nextMap[item.userId] = item.seatIds;
      });
      setSelectingSeatsMap(nextMap);
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on('connect', joinRoom);
    socket.on('show:seats-update', handleSeatUpdate);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('show:seats-update', handleSeatUpdate);
      socket.emit('show:leave', selectedShowId);
      socket.emit('seats:selecting', { showId: selectedShowId, seatIds: [] });
    };
  }, [open, selectedShowId]);

  const isSeatBooked = (seatId: string) => bookedSeats.some((seat) => seat.seatId === seatId);
  const isSeatHeldByOthers = (seatId: string) =>
    heldSeats.some((seat) => seat.seatId === seatId && String(seat.userId) !== String(user?.id || ''));
  const isSeatSelectingByOthers = (seatId: string) =>
    Object.entries(selectingSeatsMap).some(([uid, seats]) => String(uid) !== String(user?.id || '') && seats.includes(seatId));

  const handleSeatClick = (seatId: string) => {
    if (isSeatBooked(seatId)) {
      toast.error(TEXT.seatBooked);
      return;
    }

    if (isSeatHeldByOthers(seatId)) {
      toast.error(TEXT.seatHeld);
      return;
    }

    const nextSeats = selectedSeats.includes(seatId)
      ? selectedSeats.filter((id) => id !== seatId)
      : [...selectedSeats, seatId];

    setSelectedSeats(nextSeats);

    const socket = getSocket();
    if (socket?.connected && selectedShowId) {
      socket.emit('seats:selecting', { showId: selectedShowId, seatIds: nextSeats });
    }
  };

  const handleCreateBooking = async () => {
    if (!isAuthenticated) {
      toast.error(TEXT.loginRequired);
      onClose();
      return;
    }

    if (!selectedShowId || selectedSeats.length === 0 || !activeShow) {
      toast.error(TEXT.chooseShowAndSeats);
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingResponse = await createBooking({
        showId: selectedShowId,
        seatIds: selectedSeats,
        paymentMethod
      }).unwrap();

      const paymentResponse = await fetch(`${API_ROOT}/payment/sepay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: bookingResponse.booking.total,
          bookingId: bookingResponse.booking.id
        })
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentData.success) {
        throw new Error(paymentData.message || TEXT.paymentInitFailed);
      }

      const checkoutBridgeUrl = `${API_ROOT}/payment/sepay/checkout/${bookingResponse.booking.id}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutBridgeUrl)}`;

      await onPaymentReady({
        message: `M\u00ecnh \u0111\u00e3 t\u1ea1o \u0111\u01a1n \u0111\u1eb7t v\u00e9 cho phim ${movie?.title}. B\u1ea1n c\u00f3 th\u1ec3 qu\u00e9t QR ho\u1eb7c b\u1ea5m m\u1edf c\u1ed5ng thanh to\u00e1n \u0111\u1ec3 ho\u00e0n t\u1ea5t giao d\u1ecbch.`,
        qrImageUrl,
        checkoutBridgeUrl,
        bookingRef: bookingResponse.booking.bookingRef,
        amount: bookingResponse.booking.total,
        movieTitle: movie?.title || TEXT.selectedShowFallback
      });

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('seats:selecting', { showId: selectedShowId, seatIds: [] });
      }

      toast.success(TEXT.bookingCreated);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || TEXT.paymentCreateFailed);
      refetchShow();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !flow || !movie) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09090d] shadow-[0_0_120px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,234,187,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.14),transparent_30%)]" />

        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 grid max-h-[92vh] grid-cols-1 overflow-y-auto lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="border-b border-white/8 bg-white/4 p-6 lg:border-b-0 lg:border-r">
            <div className="space-y-5">
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                {TEXT.badge}
              </Badge>

              <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-black/20">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center bg-white/5 text-white/30">
                    <Ticket className="h-10 w-10" />
                    <span className="sr-only">{TEXT.noPoster}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white">{movie.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.genre.map((genre) => (
                    <Badge key={genre} variant="outline" className="border-white/10 bg-white/5 text-[10px] font-bold uppercase text-white/70">
                      {genre}
                    </Badge>
                  ))}
                  <Badge className="bg-cinema-gold/15 text-cinema-gold">{movie.certification}</Badge>
                </div>
                <p className="text-sm text-white/55">
                  {TEXT.durationPrefix} {movie.duration} {TEXT.durationSuffix}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/8 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cinema-gold">
                  <Sparkles className="h-4 w-4" />
                  {TEXT.highlights}
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/55">
                  <li>{TEXT.highlightOne}</li>
                  <li>{TEXT.highlightTwo}</li>
                  <li>{TEXT.highlightThree}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              {step !== 'schedule' && (
                <Button variant="outline" onClick={() => setStep(step === 'payment' ? 'seats' : 'schedule')} className="h-10 w-10 rounded-full border-white/10 bg-white/5 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/35">
                  {step === 'schedule' ? TEXT.step1 : step === 'seats' ? TEXT.step2 : TEXT.step3}
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white">
                  {step === 'schedule' ? TEXT.scheduleTitle : step === 'seats' ? TEXT.seatsTitle : TEXT.paymentTitle}
                </h3>
              </div>
            </div>

            {step === 'schedule' && (
              <div className="mt-8 space-y-8">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    {TEXT.chooseDate}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {visibleDates.map((date) => {
                      const actualIndex = availableDates?.findIndex((item) => item === date) ?? -1;

                      return (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDateIndex(actualIndex);
                            setSelectedShowId(null);
                          }}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${selectedDateIndex === actualIndex ? 'border-sky-400 bg-sky-500/15 text-white' : 'border-white/10 bg-white/5 text-white/45 hover:bg-white/10'}`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.22em]">{format(new Date(date), 'EEE', { locale: vi })}</div>
                          <div className="mt-1 text-lg font-bold">{format(new Date(date), 'dd/MM')}</div>
                        </button>
                      );
                    })}
                  </div>
                  {canExpandDates && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                      <p className="text-xs text-white/45">
                        {showAllDates ? TEXT.showAllDates : TEXT.showPreviewDates(INITIAL_VISIBLE_DATES)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAllDates((prev) => !prev)}
                        className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary transition-all hover:bg-primary/20"
                      >
                        {showAllDates ? TEXT.collapse : TEXT.expand}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                    <MapPin className="h-4 w-4 text-cinema-gold" />
                    {TEXT.chooseTheaterAndShow}
                  </div>

                  {showsData?.theaters?.length ? (
                    <div className="space-y-5">
                      {showsData.theaters.map((group) => (
                        <div key={group.theater.id} className="rounded-[1.75rem] border border-white/8 bg-white/4 p-5">
                          <div className="mb-4">
                            <div className="text-sm font-bold uppercase tracking-[0.18em] text-white">{group.theater.name}</div>
                            <div className="mt-1 text-xs text-white/40">{group.theater.location}</div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {group.shows.map((show) => (
                              <button
                                key={show.id}
                                onClick={() => setSelectedShowId(show.id)}
                                className={`rounded-2xl border p-4 text-left transition-all ${selectedShowId === show.id ? 'border-primary bg-primary/15 text-white shadow-[0_0_24px_rgba(239,68,68,0.16)]' : 'border-white/10 bg-black/20 text-white/55 hover:bg-white/10'}`}
                              >
                                <div className="text-lg font-bold">{format(new Date(show.startTime), 'HH:mm')}</div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em]">{show.format}</div>
                                <div className="mt-2 text-xs text-white/35">{show.screen?.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-white/8 bg-white/4 p-6 text-sm text-white/50">
                      {TEXT.noShows}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setStep('seats')}
                  disabled={!selectedShowId}
                  className="h-12 rounded-full bg-white text-black hover:bg-cinema-gold"
                >
                  {TEXT.continueSeats}
                </Button>
              </div>
            )}

            {step === 'seats' && (
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between rounded-[1.75rem] border border-white/8 bg-white/4 px-5 py-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">{TEXT.realtimeStatus}</div>
                    <div className="mt-1 text-sm text-white/60">{TEXT.viewersText(viewerCount)}</div>
                  </div>
                  <Badge className="bg-primary/15 text-primary">{TEXT.selectedSeatCount(selectedSeats.length)}</Badge>
                </div>

                {isShowLoading ? (
                  <div className="flex h-60 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-1 w-[80%] rounded-full bg-primary/40 shadow-[0_10px_30px_rgba(239,68,68,0.45)]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/25">{TEXT.screenLabel}</span>
                    </div>

                    <div
                      className="mx-auto grid gap-2 overflow-auto rounded-[1.75rem] border border-white/8 bg-black/20 p-5"
                      style={{
                        gridTemplateColumns: `repeat(${activeShow?.screen?.cols || 10}, minmax(0, 1fr))`
                      }}
                    >
                      {activeShow?.screen?.seats?.map((seat) => {
                        const isSelected = selectedSeats.includes(seat.id);
                        const isHeld = isSeatHeldByOthers(seat.id);
                        const isBooked = isSeatBooked(seat.id);
                        const isSelecting = isSeatSelectingByOthers(seat.id);

                        return (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat.id)}
                            disabled={isHeld || isBooked}
                            className={`h-8 w-8 rounded-lg border text-[9px] font-bold transition-all ${isBooked
                              ? 'border-white/5 bg-white/5 text-white/15'
                              : isHeld
                                ? 'border-cinema-gold/25 bg-cinema-gold/10 text-cinema-gold/60'
                                : isSelected
                                  ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(239,68,68,0.45)]'
                                  : isSelecting
                                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 animate-pulse'
                                    : 'border-white/10 bg-white/5 text-white/50 hover:border-primary/40 hover:bg-white/10'
                              }`}
                          >
                            {seat.row}
                            {seat.column}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-white/10" /> {TEXT.emptySeat}</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-primary" /> {TEXT.selectingSeat}</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-cinema-gold/30" /> {TEXT.heldByOther}</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-white/5 opacity-40" /> {TEXT.bookedSeat}</div>
                    </div>

                    <Button
                      onClick={() => setStep('payment')}
                      disabled={!selectedSeats.length}
                      className="h-12 rounded-full bg-white text-black hover:bg-cinema-gold"
                    >
                      {TEXT.continuePayment}
                    </Button>
                  </>
                )}
              </div>
            )}

            {step === 'payment' && (
              <div className="mt-8 space-y-6">
                <div className="rounded-[1.75rem] border border-white/8 bg-white/4 p-6">
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">{TEXT.orderSummary}</div>
                  <div className="mt-4 space-y-3 text-sm text-white/60">
                    <div className="flex items-center justify-between"><span>{TEXT.movie}</span><span className="font-bold text-white">{movie.title}</span></div>
                    <div className="flex items-center justify-between"><span>{TEXT.showtime}</span><span className="font-bold text-white">{selectedShowId ? format(new Date(activeShow?.startTime || ''), 'HH:mm - dd/MM', { locale: vi }) : '--'}</span></div>
                    <div className="flex items-center justify-between"><span>{TEXT.seats}</span><span className="font-bold text-primary">{selectedSeats.map((seatId) => {
                      const seat = activeShow?.screen?.seats?.find((item) => item.id === seatId);
                      return seat ? `${seat.row}${seat.column}` : seatId;
                    }).join(', ')}</span></div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/8 bg-white/4 p-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {TEXT.paymentMethod}
                  </div>
                  <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                    <div className="flex items-center gap-3">
                      <Radio className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-bold uppercase tracking-[0.18em] text-white">{TEXT.paymentMethodName}</div>
                        <div className="mt-1 text-xs text-white/45">{TEXT.paymentMethodDesc}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleCreateBooking}
                    disabled={isSubmitting || !selectedSeats.length}
                    className="h-14 w-full rounded-full bg-gradient-to-r from-primary via-primary to-rose-500 px-6 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-primary/30 active:scale-[0.99] disabled:scale-100 disabled:opacity-50"
                  >
                    <span className="flex w-full items-center justify-center gap-2">
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                      <span>{TEXT.createOrderAndSendQr}</span>
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
