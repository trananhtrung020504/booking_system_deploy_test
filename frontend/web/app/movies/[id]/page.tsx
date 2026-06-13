'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Star, Clock, Calendar, MapPin, ChevronRight, Play, Globe, Shield, Info, X, Ticket, Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useGetMovieQuery } from '@/store/api/movieAPI';
import { useGetShowsByMovieQuery, useGetAvailableDatesQuery, useGetShowQuery } from '@/store/api/showAPI';
import { useAppSelector } from '@/store/hooks';
import { connectSocket, getSocket } from '@/lib/socket';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: movie, isLoading } = useGetMovieQuery(id);
  const { data: dates } = useGetAvailableDatesQuery(id);
  
  // States for Booking Flow
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [activeShowId, setActiveShowId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [modalStep, setModalStep] = useState<'times' | 'seats'>('times');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [heldSeats, setHeldSeats] = useState<any[]>([]);
  const [bookedSeats, setBookedSeats] = useState<any[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [selectingSeatsMap, setSelectingSeatsMap] = useState<{ [userId: string]: string[] }>({});

  const { data: showsData, isLoading: isLoadingShows } = useGetShowsByMovieQuery(
    { movieId: id, date: selectedDate },
    { skip: !id }
  );

  const { data: activeShow, isLoading: isShowLoading } = useGetShowQuery(activeShowId as string, {
    skip: !activeShowId || modalStep !== 'seats'
  });

  const selectedShowData = showsData?.theaters.flatMap(t => t.shows).find(s => s.id === activeShowId);
  const selectedTheater = showsData?.theaters.find(t => t.shows.some(s => s.id === activeShowId))?.theater;



  useEffect(() => {
    console.log('Attempting to connect socket for detail page (Cookie mode)...');
    const socket = connectSocket();
    
    socket.on('connect', () => {
      console.log('Socket connected successfully!');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
    });
    
    socket.on('show:seats-update', ({ held, booked, selecting, viewerCount: count }) => {
      console.log('Received seats update:', { held: held.length, booked: booked.length });
      setHeldSeats(held);
      setBookedSeats(booked);
      setViewerCount(count);

      const map: { [uid: string]: string[] } = {};
      selecting?.forEach((item: any) => {
        map[item.userId] = item.seatIds;
      });
      setSelectingSeatsMap(map);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('show:seats-update');
      if (activeShowId) socket.emit('show:leave', activeShowId);
    };
  }, [activeShowId]);

  useEffect(() => {
    if (activeShowId && modalStep === 'seats') {
      const socket = getSocket();
      if (!socket) return;

      const joinRoom = () => {
        console.log('Joining room:', activeShowId);
        socket.emit('show:join', activeShowId);
      };

      if (socket.connected) {
        joinRoom();
      }

      socket.on('connect', joinRoom);
      return () => {
        socket.off('connect', joinRoom);
        socket.emit('show:leave', activeShowId);
      };
    }
  }, [activeShowId, modalStep]);

  const isSeatHeldByOthers = (seatId: string) => {
    return heldSeats.some(h => h.seatId === seatId && h.userId !== user?.id);
  };

  const isSeatBooked = (seatId: string) => {
    return bookedSeats.some(b => b.seatId === seatId);
  };

  const isSeatSelectingByOthers = (seatId: string) => {
    return Object.entries(selectingSeatsMap).some(([uid, sIds]) => 
      String(uid) !== String(user?.id || '') && sIds.includes(seatId)
    );
  };


  // Auto-select first available date
  useEffect(() => {
    if (dates && dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // Handle clicking a showtime on the main page
  const handlePageShowClick = (showId: string) => {
    setActiveShowId(prev => prev === showId ? null : showId);
  };

  // Open modal from Hero section
  const handleOpenBooking = () => {
    // If a show is already selected on the page, we can potentially skip to seats
    // but the user wants the original logic (open at 'times' step)
    setModalStep('times');
    setShowBookingModal(true);
  };

  const handleSeatClick = (seatId: string) => {
    if (isSeatBooked(seatId)) {
      toast.error('Ghế này đã được đặt');
      return;
    }

    if (isSeatHeldByOthers(seatId)) {
      toast.error('Ghế này đang có người giữ');
      return;
    }

    const isCurrentlySelected = selectedSeats.includes(seatId);
    const socket = getSocket();

    let newSeats = [];
    if (isCurrentlySelected) {
      newSeats = selectedSeats.filter(id => id !== seatId);
    } else {
      newSeats = [...selectedSeats, seatId];
    }

    setSelectedSeats(newSeats);

    // Emit selecting so others see blinking
    if (socket?.connected) {
      socket.emit('seats:selecting', { showId: activeShowId, seatIds: newSeats });
    }
  };

  const handleConfirmBooking = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
      
      const seatLabels = selectedSeats.map(id => {
        const s = activeShow?.screen?.seats?.find(st => st.id === id);
        return s ? `${s.row}${s.column}` : id;
      });

      sessionStorage.setItem('pending_booking', JSON.stringify({
        showId: activeShowId,
        seats: seatLabels
      }));
      router.push('/login');
      return;
    }
    
    if (selectedSeats.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ghế');
      return;
    }

    // Map IDs to labels (e.g. A1, B2)
    const seatLabels = selectedSeats.map(id => {
      const s = activeShow?.screen?.seats?.find(st => st.id === id);
      return s ? `${s.row}${s.column}` : id;
    });

    // Clear selecting states before redirecting
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('seats:selecting', { showId: activeShowId, seatIds: [] });
    }

    router.push(`/payment?showId=${activeShowId}&seats=${seatLabels.join(',')}`);
  };

  // Real-time alert when locally selected seats get held/booked by someone else
  useEffect(() => {
    if (!activeShow) return;
    const newlyHeldByOthers = selectedSeats.filter(id => 
      heldSeats.some(h => h.seatId === id && String(h.userId) !== String(user?.id || '') && h.expiresAt > Date.now())
    );
    if (newlyHeldByOthers.length > 0) {
      setSelectedSeats(prev => prev.filter(id => !newlyHeldByOthers.includes(id)));
      
      const labels = newlyHeldByOthers.map(id => {
        const s = activeShow?.screen?.seats?.find(st => st.id === id);
        return s ? `${s.row}${s.column}` : id;
      });
      
      toast.info(`Ghế ${labels.join(', ')} vừa mới được người khác giữ/đặt!`);
    }
  }, [heldSeats, activeShow, user?.id, selectedSeats]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[50vh] bg-zinc-900 animate-pulse" />
        <div className="container mx-auto px-4 -mt-32 relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-72 aspect-[2/3] rounded-[2rem] shadow-2xl" />
            <div className="flex-1 space-y-6 pt-12">
              <Skeleton className="h-12 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-1/4 rounded-xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Film className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Không tìm thấy phim</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden">
        {movie.poster?.source && (
          <>
            <div className="absolute right-[-5%] top-[-5%] h-[110%] w-[70%] bg-cover bg-center opacity-20 pointer-events-none z-0 mix-blend-lighten hidden md:block" style={{ backgroundImage: `url(${movie.poster.source})`, maskImage: 'linear-gradient(to left, black 20%, transparent 80%), linear-gradient(to bottom, black 20%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 80%), linear-gradient(to bottom, black 20%, transparent 80%)' }} />
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-[100px] opacity-30 pointer-events-none z-[1]" style={{ backgroundImage: `url(${movie.poster.source})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-[2]" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent z-[2]" />
          </>
        )}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-[3]" />
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 -mt-[45vh] md:-mt-[55vh] relative z-10">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
          <div className="w-full md:w-[320px] shrink-0 group relative z-10">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 group-hover:border-primary/50 transition-all duration-700">
              {movie.poster?.source ? <img src={movie.poster.source} alt={movie.title} className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-1000" /> : <div className="w-full aspect-[2/3] bg-zinc-900 flex items-center justify-center"><Film className="h-16 w-16 text-white/10" /></div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <div className="bg-primary p-4 rounded-full shadow-2xl shadow-primary/40 transform scale-75 group-hover:scale-100 transition-all duration-500"><Play className="h-8 w-8 fill-white text-white" /></div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5 justify-center md:justify-start">
               {movie.format?.map((f) => <Badge key={f} className="bg-white/5 text-white/80 border-white/10 px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wider backdrop-blur-xl">{f}</Badge>)}
               <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/20 px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wider backdrop-blur-xl">{movie.certification}</Badge>
            </div>
          </div>

          <div className="flex-1 pt-6 md:pt-12 space-y-8 z-10">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-[1] uppercase drop-shadow-2xl">{movie.title}</h1>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2.5 px-4 py-1.5 bg-cinema-gold/10 border border-cinema-gold/20 rounded-xl backdrop-blur-md">
                  <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                  <span className="text-cinema-gold font-bold text-lg leading-none">{movie.rating || 'N/A'}</span>
                </div>
                <div className="h-5 w-px bg-white/10" />
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{(movie.votes || 0).toLocaleString()} Reviews</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-[10px] text-white/50 font-black uppercase tracking-wider">
                <div className="flex items-center gap-2.5 group"><div className="p-2 bg-white/5 rounded-lg border border-white/5"><Clock className="h-3.5 w-3.5" /></div><span>{movie.duration} Phút</span></div>
                <div className="flex items-center gap-2.5 group"><div className="p-2 bg-white/5 rounded-lg border border-white/5"><Calendar className="h-3.5 w-3.5" /></div><span>{format(new Date(movie.releaseDate), 'dd/MM/yyyy', { locale: vi })}</span></div>
                <div className="flex items-center gap-2.5 group"><div className="p-2 bg-white/5 rounded-lg border border-white/5"><Globe className="h-3.5 w-3.5" /></div><span>{Array.isArray(movie.languages) ? movie.languages.join(' / ') : movie.languages}</span></div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {movie.trailerUrl && <Button onClick={() => window.open(movie.trailerUrl || undefined, '_blank')} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-14 px-8 rounded-xl font-black uppercase tracking-wider text-[10px] gap-2.5 transition-all shadow-xl"><Play className="h-4 w-4 fill-white" /> Xem Trailer</Button>}
              <Button onClick={handleOpenBooking} className="bg-primary hover:bg-primary/90 text-white h-14 px-8 rounded-xl font-black uppercase tracking-wider text-[10px] gap-2.5 shadow-2xl shadow-primary/30 active:scale-95">Đặt vé ngay <ChevronRight className="h-4 w-4" /></Button>
            </div>

            <div className="relative p-8 md:p-10 bg-white/[0.03] border border-white/5 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Info className="h-24 w-24 text-white" /></div>
              <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2.5"><div className="w-6 h-px bg-primary" /> Storyline</h3>
              <p className="text-white/70 leading-relaxed font-medium text-base md:text-lg drop-shadow-sm">{movie.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes Section */}
      <div id="showtimes-section" className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 space-y-12 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter uppercase flex items-center gap-4"><Calendar className="h-8 w-8 text-primary" /> Lịch chiếu</h2>
            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest ml-12">Chọn suất chiếu và trải nghiệm điện ảnh</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {dates?.map((date) => {
              const d = new Date(date);
              const isSelected = selectedDate === date;
              return (
                <button key={date} onClick={() => setSelectedDate(date)} className={`shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl transition-all duration-500 border ${isSelected ? 'bg-primary border-primary text-white shadow-lg scale-105 z-10' : 'bg-white/[0.03] border-white/5 text-white/30 hover:bg-white/[0.08] hover:border-white/10'}`}>
                  <span className="text-[9px] font-black uppercase tracking-tighter mb-1.5">{format(d, 'EEE', { locale: vi })}</span>
                  <span className="text-2xl font-black">{format(d, 'dd')}</span>
                  <span className="text-[8px] font-black opacity-30 mt-1">THÁNG {format(d, 'MM')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {isLoadingShows ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56 rounded-3xl bg-white/[0.03]" />)}</div>
          ) : showsData?.theaters && showsData.theaters.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {showsData.theaters.map(({ theater, shows }) => (
                <div key={theater.id} className="group relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-700 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-5 transition-all duration-700"><MapPin className="h-32 w-32" /></div>
                  <div className="flex items-center gap-6 mb-8 relative">
                    <div className="w-16 h-16 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-700">{theater.logo?.source ? <img src={theater.logo.source} alt={theater.name} className="w-full h-full object-contain" /> : <Film className="h-8 w-8 text-black" />}</div>
                    <div><h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{theater.name}</h3><p className="text-[10px] text-white/30 font-black uppercase tracking-wider flex items-center gap-2 mt-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {theater.location}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-3 relative">
                    {shows.map((show) => {
                      const isActive = activeShowId === show.id;
                      return (
                        <button 
                          key={show.id} 
                          onClick={() => handlePageShowClick(show.id)} 
                          className={`group/btn px-6 py-3 border rounded-xl transition-all duration-500 text-left min-w-[110px] shadow-lg relative overflow-visible ${
                            isActive 
                              ? 'bg-primary border-primary scale-110 shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-2 ring-primary ring-offset-2 ring-offset-black z-10' 
                              : 'bg-white/5 border-white/10 hover:border-primary/50'
                          }`}
                        >
                          <div className={`font-black text-xl mb-0.5 leading-none transition-colors ${isActive ? 'text-white' : 'text-white/80 group-hover/btn:text-white'}`}>
                            {format(new Date(show.startTime), 'HH:mm')}
                          </div>
                          <div className={`text-[8px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-white/80' : 'text-white/30'}`}>
                            {show.format} • {show.screen?.name || (show as any).screenName || 'P01'}
                          </div>
                          
                          {/* Animated Checkmark Badge */}
                          {isActive && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] animate-in zoom-in duration-300">
                              <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />
                            </div>
                          )}

                          {/* Subtle pulse effect for active state */}
                          {isActive && (
                            <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse -z-10" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]"><div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6"><Calendar className="h-10 w-10 text-white/10" /></div><p className="text-xl font-black text-white/10 uppercase tracking-widest">No Screenings</p></div>
          )}
        </div>
      </div>

      {/* --- BOOKING MODAL (Sliding Version) --- */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div onClick={() => { setShowBookingModal(false); setSelectedSeats([]); }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
           <div className="relative w-full max-w-5xl bg-[#0a0a0f] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12">
                 {/* Left: Summary */}
                 <div className="md:col-span-4 bg-zinc-900/50 p-10 space-y-8 relative z-40">
                    <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10">{movie.poster?.source ? <img src={movie.poster.source} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Film className="w-10 h-10 text-white/10" /></div>}</div>
                    <div className="space-y-4">
                       <h3 className="text-2xl font-bold uppercase tracking-tight text-white leading-none">{movie.title}</h3>
                       <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 text-white/40 text-xs font-bold uppercase"><MapPin className="w-4 h-4 text-cinema-gold" /> {selectedTheater?.name || 'Vui lòng chọn rạp'}</div>
                          <div className="flex items-center gap-3 text-white/40 text-xs font-bold uppercase"><Calendar className="w-4 h-4 text-blue-400" /> {selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy') : '...'}</div>
                          {activeShowId && <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase animate-fade-in"><Clock className="w-4 h-4" /> Suất: {selectedShowData ? format(new Date(selectedShowData.startTime), 'HH:mm') : '...'}</div>}
                       </div>
                    </div>
                 </div>

                 {/* Right: Times or Seats */}
                 <div className="md:col-span-8 px-12 py-10 relative flex flex-col min-h-[650px] z-30 bg-[#0a0a0f] border-l border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between z-20 mb-8 pl-6">
                       <div className="space-y-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">{modalStep === 'times' ? 'Bước 4' : 'Bước 5'}</span>
                          <h2 className="text-4xl font-bold uppercase tracking-tighter">{modalStep === 'times' ? 'Chọn suất chiếu' : 'Chọn vị trí ghế'}</h2>
                       </div>
                       <div className="flex items-center gap-4">
                          {modalStep === 'seats' && <Button onClick={() => setModalStep('times')} variant="outline" className="w-10 h-10 rounded-full bg-white/5 border-white/10 flex items-center justify-center p-0"><ChevronLeft className="w-5 h-5" /></Button>}
                          <button onClick={() => { setShowBookingModal(false); setSelectedSeats([]); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"><X className="w-5 h-5 text-white/40 group-hover:text-white" /></button>
                       </div>
                    </div>

                    <div className="relative flex-1 overflow-visible">
                       {/* TIMES STEP */}
                       <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${modalStep === 'times' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
                          <div className="space-y-10 h-[400px] overflow-y-auto pl-6 pr-4 scrollbar-hide pb-10 overflow-x-visible">
                             {showsData?.theaters.map(({ theater, shows }) => (
                               <div key={theater.id} className="space-y-6">
                                  <div className="flex items-center gap-4"><span className="text-xs font-bold text-white/60 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">{theater.name}</span><div className="h-px flex-1 bg-white/5" /></div>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                     {shows.map(s => {
                                       const isActive = activeShowId === s.id;
                                       return (
                                         <button 
                                           key={s.id} 
                                           onClick={() => setActiveShowId(prev => prev === s.id ? null : s.id)} 
                                           className={`h-14 rounded-full border transition-all duration-500 font-bold relative flex items-center justify-center overflow-hidden group/btn ${
                                             isActive 
                                               ? 'bg-gradient-to-r from-primary to-rose-400 border-transparent text-white scale-110 shadow-[0_10px_25px_rgba(239,68,68,0.4)] z-10' 
                                               : 'bg-white/5 border-white/10 text-white/40 hover:border-primary/50 hover:bg-white/10 hover:text-white'
                                           }`}
                                         >
                                           {/* Glossy overlay for active state */}
                                           {isActive && <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-50" />}
                                           
                                           <span className="relative z-10">{format(new Date(s.startTime), 'HH:mm')}</span>
                                           
                                           {isActive && (
                                             <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                                               <Check className="w-3.5 h-3.5 text-primary stroke-[4]" />
                                             </div>
                                           )}

                                           {/* Pulse Ring */}
                                           {isActive && (
                                             <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-20" />
                                           )}
                                         </button>
                                       );
                                     })}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       {/* SEATS STEP */}
                       <div className={`absolute top-0 left-0 w-full h-full transition-all duration-700 ease-in-out ${modalStep === 'seats' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
                          <div className="h-full overflow-y-auto pr-4 pb-[260px] scrollbar-hide">
                             {isShowLoading ? (
                               <div className="flex items-center justify-center h-64">
                                  <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                               </div>
                             ) : (
                               <div className="space-y-8 flex flex-col items-center pt-4">
                                  <div className="w-full flex flex-col items-center gap-2"><div className="w-[80%] h-1 bg-primary/40 rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.5)]" /><span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Màn hình rạp chiếu</span></div>
                                   
                                  {selectedSeats.some(id => isSeatSelectingByOthers(id)) && (
                                    <div className="w-full max-w-md mx-auto py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500/90 flex items-center gap-2 justify-center animate-pulse">
                                      <Info className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                                      <span>Có ghế bạn vừa chọn đang được khách hàng khác xem. Hãy nhanh tay thanh toán!</span>
                                    </div>
                                  )}
                                  <div 
                                    className="grid gap-3" 
                                    style={{ 
                                      gridTemplateColumns: `repeat(${activeShow?.screen?.cols || 10}, minmax(0, 1fr))` 
                                    }}
                                  >
                                     {activeShow?.screen?.seats?.map((seat) => {
                                       const isSelected = selectedSeats.includes(seat.id);
                                       const isHeld = isSeatHeldByOthers(seat.id);
                                       const isBooked = isSeatBooked(seat.id);
                                       const isSelectingByOthers = isSeatSelectingByOthers(seat.id);
                                       const label = `${seat.row}${seat.column}`;
                                       
                                       return (
                                         <div 
                                           key={seat.id} 
                                           onClick={() => !isBooked && !isHeld && handleSeatClick(seat.id)} 
                                           className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[8px] font-bold transition-all cursor-pointer border relative group/seat ${
                                             isBooked ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed opacity-30 pointer-events-none' : 
                                             isHeld ? 'bg-white/10 border-white/10 text-white/20 cursor-not-allowed animate-pulse pointer-events-none' : 
                                             isSelected ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-110 z-10' : 
                                             isSelectingByOthers ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse' :
                                             'bg-white/5 border-white/10 text-white/40 hover:border-primary/50 hover:bg-white/10'
                                           }`}
                                         >
                                           {label}
                                           {isHeld && (
                                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cinema-gold rounded-full shadow-lg" />
                                           )}
                                         </div>
                                       );
                                     })}
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>

                     {modalStep === 'seats' && (
                        <div className="absolute bottom-[144px] left-10 right-10 flex flex-wrap justify-center gap-4 text-[9px] font-bold uppercase tracking-wider text-white/40 py-2 border-t border-white/5 bg-[#0b0b0f]/95 backdrop-blur-sm z-20">
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white/10" /> Trống</div>
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-primary" /> Đang chọn</div>
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-500 animate-pulse" /> Ai đó đang xem (Có thể tranh chọn)</div>
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white/10 border border-cinema-gold animate-pulse" /> Đang thanh toán (Khóa tạm thời)</div>
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white/5 opacity-30" /> Đã đặt</div>
                        </div>
                     )}

                    <div className="absolute bottom-0 left-0 right-0 p-10 flex items-center justify-between border-t border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md z-30">
                       <div className="flex flex-col"><span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{modalStep === 'times' ? 'Suất chiếu' : 'Tổng cộng'}</span><span className="text-xl font-bold text-white uppercase">
                             {modalStep === 'times' ? (activeShowId ? format(new Date(activeShow?.startTime || showsData?.theaters.flatMap(t => t.shows).find(s => s.id === activeShowId)?.startTime || ''), 'HH:mm') : '--:--') : `${(selectedSeats.length * (activeShow?.priceMap?.STANDARD || 95000)).toLocaleString()} VNĐ`}
                           </span></div>
                       {modalStep === 'times' ? (
                         <Button disabled={!activeShowId} onClick={() => setModalStep('seats')} className="h-16 px-10 rounded-2xl bg-gradient-to-b from-[#fceabb] to-[#f8d49d] text-[#1a1a1a] font-bold uppercase tracking-wider text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20">Tiếp tục chọn ghế <ChevronRight className="ml-2 w-4 h-4" /></Button>
                       ) : (
                         <Button disabled={selectedSeats.length === 0} onClick={handleConfirmBooking} className="h-16 px-10 rounded-2xl bg-primary text-white font-bold uppercase tracking-wider text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20">Xác nhận thanh toán ({selectedSeats.length})</Button>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
