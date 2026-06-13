'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Star, Clock, ChevronRight, Play, Ticket, ChevronDown, LayoutGrid, Calendar, X, MapPin, ChevronLeft as ChevronLeftIcon, Users, Zap, Info, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMoviesQuery } from '@/store/api/movieAPI';
import { useGetShowQuery, useGetAvailableDatesQuery, useGetShowsByMovieQuery } from '@/store/api/showAPI';
import { useAppSelector } from '@/store/hooks';
import { connectSocket, getSocket } from '@/lib/socket';
import type { Movie, Show } from '@/types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, FreeMode } from 'swiper/modules';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';


function MovieCard({ movie, onSelect }: { movie: Movie; onSelect: (m: Movie) => void }) {
  const router = useRouter();
  return (
    <div className="group relative space-y-4">
      <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-primary/50 transition-all duration-700 shadow-2xl group-hover:shadow-primary/20">
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          {movie.poster?.source ? (
            <img src={movie.poster.source} alt={movie.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
          ) : (
            <Film className="w-12 h-12 text-white/5" />
          )}
        </div>
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <Star className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold" />
          <span className="text-[11px] font-bold text-white">{movie.rating || 'N/A'}</span>
        </div>
        <div className="absolute inset-0 z-30 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
          <Button onClick={() => onSelect(movie)} className="rounded-full bg-gradient-to-b from-[#fceabb] to-[#f8d49d] text-[#1a1a1a] font-bold uppercase tracking-wider text-[10px] px-8 py-6 h-auto shadow-2xl hover:scale-105 transition-all">
            <Ticket className="w-4 h-4 mr-2" /> Đặt Vé
          </Button>
          <Button onClick={() => router.push(`/movies/${movie.id}`)} variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider px-8 py-2.5 h-auto transition-all">
            Chi tiết
          </Button>
        </div>
      </div>
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2">
          {movie.format?.map((f: string) => (
            <span key={f} className="text-[8px] font-bold text-primary uppercase border border-primary/30 px-1.5 py-0.5 rounded-sm">{f}</span>
          ))}
          <span className="text-[8px] font-bold text-white/30 uppercase">{movie.duration}m</span>
        </div>
        <h3 className="text-base font-bold text-white uppercase tracking-tight line-clamp-1 group-hover:text-cinema-gold transition-colors">{movie.title}</h3>
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">{movie.genre?.join(' • ')}</p>
      </div>
    </div>
  );
}

function MovieSlider({ movies, onSelect }: { movies: Movie[]; onSelect: (m: Movie) => void }) {
  const swiperRef = useRef<any>(null);
  return (
    <div className="relative px-0 md:px-12">
      <button onClick={() => swiperRef.current?.slidePrev()} className="hidden md:flex absolute left-0 top-[35%] -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 border border-white/10 items-center justify-center backdrop-blur-xl transition-all hover:bg-primary hover:border-primary group/btn shadow-2xl shadow-black"><ChevronLeftIcon className="w-5 h-5 text-white" /></button>
      <button onClick={() => swiperRef.current?.slideNext()} className="hidden md:flex absolute right-0 top-[35%] -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 border border-white/10 items-center justify-center backdrop-blur-xl transition-all hover:bg-primary hover:border-primary group/btn shadow-2xl shadow-black"><ChevronRight className="w-5 h-5 text-white" /></button>
      <Swiper modules={[Navigation, Autoplay, FreeMode]} onSwiper={(swiper) => (swiperRef.current = swiper)} spaceBetween={24} slidesPerView={2.2} freeMode={true} speed={800} breakpoints={{ 640: { slidesPerView: 3.2 }, 1024: { slidesPerView: 4.2 }, 1280: { slidesPerView: 5.2 }, 1536: { slidesPerView: 6 } }} className="w-full">
        {movies.map((movie) => (
          <SwiperSlide key={movie.id} className="pb-4"><MovieCard movie={movie} onSelect={onSelect} /></SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function MovieSliderSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden px-0 md:px-12">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex-shrink-0 w-[45vw] sm:w-[31vw] lg:w-[23vw] xl:w-[19vw] 2xl:w-[16vw] space-y-4 opacity-80">
          <Skeleton className="aspect-[2/3] w-full rounded-[2rem] bg-white/10" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-4 w-2/3 bg-white/10" />
            <Skeleton className="h-3 w-1/2 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: trendingData, isLoading: isTrendingLoading } = useGetMoviesQuery({ limit: 10, sort: 'rating' });
  const { data: nowShowingData, isLoading: isNowShowingLoading } = useGetMoviesQuery({ limit: 12, status: 'now-showing' });
  const { data: comingSoonData, isLoading: isComingSoonLoading } = useGetMoviesQuery({ limit: 12, status: 'coming-soon' });

  const featuredMovie = trendingData?.movies?.[0];
  const sectionCRef = useRef<HTMLDivElement>(null);
  const datesScrollRef = useRef<HTMLDivElement>(null);

  const scrollDates = (direction: 'left' | 'right') => {
    if (datesScrollRef.current) {
      const scrollAmount = 300;
      datesScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showMovieSelect, setShowMovieSelect] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [modalStep, setModalStep] = useState<'times' | 'seats'>('times');
  const [selectedCinema, setSelectedCinema] = useState('RoPhim Hùng Vương');
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [heldSeats, setHeldSeats] = useState<any[]>([]);
  const [bookedSeats, setBookedSeats] = useState<any[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [selectingSeatsMap, setSelectingSeatsMap] = useState<{ [userId: string]: string[] }>({});

  const { data: availableDates } = useGetAvailableDatesQuery(selectedMovie?.id as string, {
    skip: !selectedMovie?.id
  });

  const { data: showsData } = useGetShowsByMovieQuery(
    {
      movieId: selectedMovie?.id as string,
      date: availableDates?.[selectedDate]
    },
    { skip: !selectedMovie?.id || !availableDates }
  );

  const { data: activeShow, isLoading: isShowLoading } = useGetShowQuery(selectedShowId as string, {
    skip: !selectedShowId || modalStep !== 'seats'
  });

  useEffect(() => {
    console.log('Attempting to connect socket for home page (Cookie mode)...');
    const socket = connectSocket();

    socket.on('connect', () => {
      console.log('Socket connected successfully (Home)!');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected (Home):', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('show:seats-update', ({ held, booked, selecting, viewerCount: count }) => {
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
      if (selectedShowId) socket.emit('show:leave', selectedShowId);
    };
  }, [selectedShowId]);

  useEffect(() => {
    if (selectedShowId && modalStep === 'seats') {
      const socket = getSocket();
      if (!socket) return;

      const joinRoom = () => {
        console.log('Joining room (Home):', selectedShowId);
        socket.emit('show:join', selectedShowId);
      };

      if (socket.connected) {
        joinRoom();
      }

      socket.on('connect', joinRoom);
      return () => {
        socket.off('connect', joinRoom);
        socket.emit('show:leave', selectedShowId);
      };
    }
  }, [selectedShowId, modalStep]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    sectionCRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    const socket = getSocket();
    const isCurrentlySelected = selectedSeats.includes(seatId);

    let newSeats = [];
    if (isCurrentlySelected) {
      newSeats = selectedSeats.filter(id => id !== seatId);
    } else {
      newSeats = [...selectedSeats, seatId];
    }

    setSelectedSeats(newSeats);

    // Emit selecting so others see blinking
    if (socket?.connected) {
      socket.emit('seats:selecting', { showId: selectedShowId, seatIds: newSeats });
    }
  };

  const handleHomeConfirmBooking = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');

      const seatLabels = selectedSeats.map(id => {
        const s = activeShow?.screen?.seats?.find(st => st.id === id);
        return s ? `${s.row}${s.column}` : id;
      });

      sessionStorage.setItem('pending_booking', JSON.stringify({
        showId: selectedShowId,
        seats: seatLabels
      }));
      router.push('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ghế');
      return;
    }

    const seatLabels = selectedSeats.map(id => {
      const s = activeShow?.screen?.seats?.find(st => st.id === id);
      return s ? `${s.row}${s.column}` : id;
    });

    // Clear selecting states before redirecting
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('seats:selecting', { showId: selectedShowId, seatIds: [] });
    }

    router.push(`/payment?showId=${selectedShowId}&seats=${seatLabels.join(',')}`);
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


  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-primary selection:text-white pb-20">
      <section className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden flex items-center">
        {featuredMovie?.poster?.source ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${featuredMovie.poster.source})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent z-10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}
        <div className="relative z-20 container mx-auto px-6 md:px-10 h-full flex flex-col justify-center pt-20">
          <div className="max-w-4xl space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">{featuredMovie?.title || 'Trải nghiệm đỉnh cao'}</h1>
              <p className="text-sm md:text-lg font-bold text-cinema-gold uppercase tracking-wide flex items-center gap-3"><Star className="w-5 h-5 fill-cinema-gold" /> Phim bom tấn đang cháy vé • {featuredMovie?.rating || '9.8'}/10</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {featuredMovie?.format?.map(f => (
                <Badge key={f} className="bg-white/10 border-white/10 text-white text-[10px] font-semibold py-1.5 px-4 rounded-md uppercase tracking-wider">{f}</Badge>
              ))}
              <Badge className="bg-primary/20 border-primary/30 text-primary text-[10px] font-semibold py-1.5 px-4 rounded-md uppercase tracking-wider">{featuredMovie?.certification || 'T18'}</Badge>
            </div>
            <p className="text-sm md:text-lg text-white/50 max-w-2xl font-medium leading-relaxed line-clamp-3">{featuredMovie?.description || 'Khám phá thế giới điện ảnh đầy màu sắc với những bộ phim bom tấn mới nhất.'}</p>
            <div className="flex items-center gap-8 pt-6">
              <div onClick={() => featuredMovie && handleSelectMovie(featuredMovie)} className="flex items-center gap-5 group cursor-pointer">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-[#fceabb] to-[#f8d49d] text-[#1a1a1a] shadow-[0_15px_40px_rgba(252,234,187,0.3)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-[#fceabb]/50"><Ticket className="w-10 h-10 transform -rotate-12" /></div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold uppercase tracking-tighter leading-none group-hover:text-cinema-gold transition-colors">Đặt vé ngay</span>
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-2">Chọn chỗ & xem ngay</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => featuredMovie?.trailerUrl && window.open(featuredMovie.trailerUrl, '_blank')} variant="outline" className="w-14 h-14 md:w-16 md:h-16 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl transition-all hover:scale-110"><Play className="w-6 h-6 fill-white" /></Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-10 py-24 space-y-24">
        {(isNowShowingLoading || (nowShowingData?.movies && nowShowingData.movies.length > 0)) && (
          <div className="space-y-12">
            <div className="flex items-end justify-between border-b border-white/5 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="h-px w-8 bg-primary" /><span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Phòng vé hôm nay</span></div>
                <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter flex items-center gap-4">Phim Đang Chiếu <ChevronRight className="w-10 h-10 text-white/10" /></h2>
              </div>
              <Link href="/movies?status=now-showing"><Button variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase px-6">Xem tất cả</Button></Link>
            </div>
            {isNowShowingLoading ? <MovieSliderSkeleton /> : (nowShowingData?.movies && <MovieSlider movies={nowShowingData.movies} onSelect={handleSelectMovie} />)}
          </div>
        )}

        {(isComingSoonLoading || (comingSoonData?.movies && comingSoonData.movies.length > 0)) && (
          <div className="space-y-12">
            <div className="flex items-end justify-between border-b border-white/5 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="h-px w-8 bg-cinema-gold" /><span className="text-[10px] font-bold text-cinema-gold uppercase tracking-[0.3em]">Sắp ra mắt</span></div>
                <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter flex items-center gap-4">Phim Sắp Chiếu <ChevronRight className="w-10 h-10 text-white/10" /></h2>
              </div>
              <Link href="/movies?status=coming-soon"><Button variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase px-6">Xem tất cả</Button></Link>
            </div>
            {isComingSoonLoading ? <MovieSliderSkeleton /> : (comingSoonData?.movies && <MovieSlider movies={comingSoonData.movies} onSelect={handleSelectMovie} />)}
          </div>
        )}

        {(isTrendingLoading || (trendingData?.movies && trendingData.movies.length > 0)) && (
          <div className="space-y-12">
            <div className="flex items-end justify-between border-b border-white/5 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="h-px w-8 bg-blue-500" /><span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">Bảng xếp hạng</span></div>
                <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter flex items-center gap-4">Top Phim Nổi Bật <ChevronRight className="w-10 h-10 text-white/10" /></h2>
              </div>
            </div>
            {isTrendingLoading ? <MovieSliderSkeleton /> : (trendingData?.movies && <MovieSlider movies={trendingData.movies} onSelect={handleSelectMovie} />)}
          </div>
        )}
      </section>

      <section ref={sectionCRef} className="container mx-auto px-6 md:px-10 py-24 scroll-mt-20">
        <div className="space-y-8">
          <div className="flex items-center gap-4"><div className="w-1.5 h-8 bg-primary rounded-full" /><h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter">Đặt Vé Nhanh</h2></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 relative group overflow-hidden rounded-[3rem] border border-white/5 bg-zinc-950/50 shadow-2xl min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-zinc-900">
                {selectedMovie?.poster?.source ? <img src={selectedMovie.poster.source} className="w-full h-full object-cover animate-fade-in" alt="" /> : <div className="w-full h-full flex items-center justify-center text-white/5 font-bold uppercase tracking-[1em] rotate-12 text-6xl">POSTER</div>}
              </div>
              <div className="absolute bottom-10 left-10 right-10 z-20 space-y-4">
                <Badge className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${selectedMovie ? 'bg-primary/20 text-primary border-primary/20' : 'bg-white/10 text-white/40 border-white/10'}`}>{selectedMovie ? 'Phim đã chọn' : 'Bước 1'}</Badge>
                <div className="relative">
                  <h3 onClick={() => setShowMovieSelect(!showMovieSelect)} className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white leading-none cursor-pointer hover:text-cinema-gold transition-colors flex items-center gap-2">
                    {selectedMovie?.title || 'Mời bạn chọn phim'}
                    <ChevronDown className={`w-6 h-6 transition-transform ${showMovieSelect ? 'rotate-180' : ''}`} />
                  </h3>
                  {showMovieSelect && (
                    <div className="absolute bottom-full mb-4 left-0 w-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="p-4 border-b border-white/5 bg-white/5"><span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Danh sách phim đang chiếu</span></div>
                      <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                        {nowShowingData?.movies?.map((m) => (
                          <div key={m.id} onClick={() => { setSelectedMovie(m); setShowMovieSelect(false); }} className="flex items-center gap-4 p-4 hover:bg-primary/10 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                            <div className="w-12 h-16 rounded-md bg-zinc-800 flex-shrink-0 overflow-hidden">{m.poster?.source && <img src={m.poster.source} className="w-full h-full object-cover" />}</div>
                            <div className="flex flex-col"><span className="text-sm font-bold text-white uppercase line-clamp-1">{m.title}</span><span className="text-[10px] text-white/40 font-semibold">{m.genre.join(', ')}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button onClick={() => setShowMovieSelect(!showMovieSelect)} variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 text-[10px] font-bold uppercase px-6 py-2">{selectedMovie ? 'Thay Đổi Phim' : 'Chọn Phim Ngay'}</Button>
              </div>
            </div>
            <div className={`lg:col-span-7 min-w-0 grid grid-rows-2 gap-6 transition-all duration-700 ${!selectedMovie ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100 grayscale-0'}`}>
              <div className="relative rounded-[3rem] border border-white/5 bg-zinc-950/40 p-8 md:p-10 flex flex-col justify-between group hover:border-cinema-gold/30 transition-all shadow-xl min-w-0 overflow-hidden">
                <MapPin className="absolute -right-8 -bottom-8 w-40 h-40 text-white/[0.02] transform -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1"><span className="text-[10px] font-bold text-cinema-gold uppercase tracking-widest">Khu vực</span><h4 className="text-2xl font-bold text-white uppercase tracking-tight">Chọn Rạp Chiếu</h4></div>
                  <div className="w-12 h-12 rounded-2xl bg-cinema-gold/10 flex items-center justify-center border border-cinema-gold/20 text-cinema-gold"><LayoutGrid className="w-6 h-6" /></div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10 opacity-60">
                  <div className="flex items-center gap-1.5 mb-3">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold drop-shadow-lg" />)}
                  </div>
                  <p className="text-[10px] font-bold text-white/50 text-center uppercase tracking-[0.2em] leading-relaxed max-w-[80%]">Hệ thống rạp chiếu phim<br/>đạt chuẩn quốc tế</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  {['RoPhim Hùng Vương', 'RoPhim Thủ Đức'].map(r => (
                    <button key={r} onClick={() => setSelectedCinema(r)} className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl transition-all border text-left ${selectedCinema === r ? 'bg-cinema-gold/10 border-cinema-gold text-cinema-gold shadow-[0_0_20px_rgba(252,234,187,0.1)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/20'}`}>
                      <div className={`p-2.5 rounded-xl transition-colors ${selectedCinema === r ? 'bg-cinema-gold text-black shadow-lg' : 'bg-white/10 text-white/50'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm font-black uppercase tracking-tight">{r}</span>
                        <span className="text-[9px] uppercase tracking-widest mt-1 opacity-70">TP. Hồ Chí Minh</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[3rem] border border-white/5 bg-zinc-950/40 p-8 md:p-10 flex flex-col gap-8 shadow-xl min-w-0">
                <div className="w-full min-w-0">
                  <div className="space-y-1 flex items-end justify-between pr-4 mb-4">
                    <div><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Thời gian</span><h4 className="text-2xl font-bold text-white uppercase tracking-tight">Chọn Ngày Xem</h4></div>
                  </div>

                  <div className="relative group/scroll -mx-2 md:-mx-6">
                    <button onClick={() => scrollDates('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/90 border border-white/10 flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-primary hover:border-primary shadow-2xl hover:scale-110">
                      <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button>

                    <button onClick={() => scrollDates('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/90 border border-white/10 flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-primary hover:border-primary shadow-2xl hover:scale-110">
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>

                    <div ref={datesScrollRef} className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide scroll-smooth px-8 md:px-14 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                      {availableDates?.map((date, i) => {
                        const d = new Date(date);
                        return (
                          <div key={date} onClick={() => setSelectedDate(i)} className={`flex-shrink-0 w-14 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 ${selectedDate === i ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'}`}>
                            <span className="text-[10px] font-bold uppercase">{format(d, 'EEE', { locale: vi })}</span>
                            <span className="text-xl font-bold">{format(d, 'dd')}</span>
                          </div>
                        );
                      })}
                      {(!availableDates || availableDates.length === 0) && <span className="text-white/20 text-[10px] uppercase font-bold">Không có lịch chiếu</span>}
                    </div>
                  </div>
                </div>

                <div className="w-full flex justify-center border-t border-white/5 pt-6 px-4 md:px-12">
                  <Button onClick={() => { setSelectedTime(null); setModalStep('times'); setShowTimeModal(true); }} className="w-full h-14 rounded-full bg-gradient-to-r from-[#fceabb] to-[#f8d49d] text-[#1a1a1a] flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(252,234,187,0.2)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50" disabled={!selectedMovie}>
                    <Ticket className="w-6 h-6 transform -rotate-12" />
                    <span className="text-sm font-bold uppercase tracking-widest">Tiếp tục đặt vé</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showTimeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div onClick={() => { setShowTimeModal(false); setSelectedSeats([]); }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          <div className="relative w-full max-w-5xl bg-[#0a0a0f] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-4 bg-zinc-900/50 p-10 space-y-8 border-r border-white/5 z-20">
                <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10">{selectedMovie?.poster?.source ? <img src={selectedMovie.poster.source} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Film className="w-10 h-10 text-white/10" /></div>}</div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white leading-none">{selectedMovie?.title}</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-white/40 text-xs font-bold uppercase"><MapPin className="w-4 h-4 text-cinema-gold" /> {selectedCinema}</div>
                    <div className="flex items-center gap-3 text-white/40 text-xs font-bold uppercase"><Calendar className="w-4 h-4 text-blue-400" /> {availableDates?.[selectedDate] ? format(new Date(availableDates[selectedDate]), 'dd MMMM, yyyy', { locale: vi }) : '...'}</div>
                    {selectedTime && <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase animate-fade-in"><Clock className="w-4 h-4" /> Suất: {selectedTime}</div>}
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 px-12 py-10 relative flex flex-col min-h-[650px] z-30 bg-[#0a0a0f] border-l border-white/5 overflow-hidden">
                <div className="flex items-center justify-between z-20 mb-8 pl-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">{modalStep === 'times' ? 'Bước 4' : 'Bước 5'}</span>
                    <div className="flex items-center gap-4">
                      <h2 className="text-4xl font-bold uppercase tracking-tighter transition-all">{modalStep === 'times' ? 'Chọn suất chiếu' : 'Chọn vị trí ghế'}</h2>
                      {modalStep === 'seats' && <Badge className="bg-white/5 border-white/10 text-white/40 gap-2 px-3 py-1 rounded-full"><Users className="w-3 h-3" /> {viewerCount} Đang xem</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {modalStep === 'seats' && <Button onClick={() => setModalStep('times')} variant="outline" className="w-10 h-10 rounded-full bg-white/5 border-white/10 flex items-center justify-center p-0"><ChevronLeftIcon className="w-5 h-5" /></Button>}
                    <button onClick={() => { setShowTimeModal(false); setSelectedSeats([]); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"><X className="w-5 h-5 text-white/40 group-hover:text-white" /></button>
                  </div>
                </div>

                <div className="relative flex-1 overflow-visible">
                  {/* TIMES STEP */}
                  <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${modalStep === 'times' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
                    <div className="space-y-10 h-[400px] overflow-y-auto pl-6 pr-4 scrollbar-hide pb-10 overflow-x-visible">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4"><span className="text-xs font-bold text-white/60 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">2D Digital</span><div className="h-px flex-1 bg-white/5" /></div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                          {showsData?.theaters.flatMap(t => t.shows).map((s) => {
                            const timeLabel = format(new Date(s.startTime), 'HH:mm');
                            const isActive = selectedShowId === s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={() => { setSelectedTime(timeLabel); setSelectedShowId(isActive ? null : s.id); }}
                                className={`h-14 rounded-full border transition-all duration-500 font-bold relative flex items-center justify-center overflow-hidden group/btn ${isActive
                                  ? 'bg-gradient-to-r from-primary to-rose-400 border-transparent text-white scale-110 shadow-[0_10px_25px_rgba(239,68,68,0.4)] z-10'
                                  : 'bg-white/5 border-white/10 text-white/40 hover:border-primary/50 hover:bg-white/10 hover:text-white'
                                  }`}
                              >
                                {/* Glossy overlay for active state */}
                                {isActive && <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-50" />}

                                <span className="relative z-10">{timeLabel}</span>

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
                          {(!showsData?.theaters || showsData.theaters.length === 0) && (
                            <div className="col-span-full py-10 text-center text-white/20 font-bold uppercase tracking-widest">Không có suất chiếu nào</div>
                          )}
                        </div>
                      </div>
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
                        <div className="space-y-8 flex flex-col items-center pt-4 animate-in fade-in duration-500">
                          <div className="w-full flex flex-col items-center gap-2">
                            <div className="w-[80%] h-1 bg-primary/40 rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.5)]" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Màn hình rạp chiếu</span>
                          </div>


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
                                  className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[8px] font-bold transition-all cursor-pointer border relative group/seat ${isBooked ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed opacity-30 pointer-events-none' :
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
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{modalStep === 'times' ? 'Suất chiếu' : 'Tổng cộng'}</span>
                    <span className="text-xl font-bold text-white uppercase">
                      {modalStep === 'times' ? (selectedTime || '--:--') : (
                        <div className="flex items-center gap-3">
                          <span>{((selectedSeats.length) * (activeShow?.priceMap?.STANDARD || 95000)).toLocaleString()} VNĐ</span>
                          {selectedSeats.length > 0 && <Badge className="bg-primary/20 text-primary border-none animate-bounce"><Zap className="w-3 h-3 mr-1" /> Giữ ghế thành công</Badge>}
                        </div>
                      )}
                    </span>
                  </div>
                  {modalStep === 'times' ? (
                    <Button disabled={!selectedTime} onClick={() => setModalStep('seats')} className="h-16 px-10 rounded-2xl bg-gradient-to-b from-[#fceabb] to-[#f8d49d] text-[#1a1a1a] font-bold uppercase tracking-wider text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20">Tiếp tục chọn ghế <ChevronRight className="ml-2 w-4 h-4" /></Button>
                  ) : (
                    <Button disabled={selectedSeats.length === 0} onClick={handleHomeConfirmBooking} className="h-16 px-10 rounded-2xl bg-primary text-white font-bold uppercase tracking-wider text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 animate-fade-in">Xác nhận thanh toán ({selectedSeats.length})</Button>
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
