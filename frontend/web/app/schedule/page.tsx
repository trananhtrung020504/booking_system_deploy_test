'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Star, Clock, Film, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { useGetShowsQuery } from '@/store/api/showAPI';
import { useGetTheatersQuery } from '@/store/api/theaterAPI';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function SchedulePage() {
  const { data: theatersResponse, isLoading: isLoadingTheaters } = useGetTheatersQuery();
  const theaters = theatersResponse?.theaters || [];

  const [selectedTheaterId, setSelectedTheaterId] = useState<string>('');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Auto-select first theater when loaded
  useEffect(() => {
    if (theaters.length > 0 && !selectedTheaterId) {
      setSelectedTheaterId(theaters[0].id);
    }
  }, [theaters, selectedTheaterId]);

  // Generate 7 days for the calendar starting from today
  const calendarDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const selectedDateStr = format(calendarDates[selectedDateIndex], 'yyyy-MM-dd');

  // Load real shows for selected theater and date
  const { data: showsData, isLoading: isLoadingShows } = useGetShowsQuery(
    { theaterId: selectedTheaterId || undefined, date: selectedDateStr },
    { skip: !selectedTheaterId }
  );

  // Group shows by movie
  const moviesWithShowsMap: Record<string, { movie: any; shows: any[] }> = {};
  showsData?.forEach((show) => {
    if (!show.movie) return;
    if (!moviesWithShowsMap[show.movieId]) {
      moviesWithShowsMap[show.movieId] = {
        movie: show.movie,
        shows: [],
      };
    }
    moviesWithShowsMap[show.movieId].shows.push(show);
  });

  const moviesWithShows = Object.values(moviesWithShowsMap);

  return (
    <div className="min-h-screen bg-background text-white pt-28 pb-16 px-6 md:px-10 max-w-[1450px] mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,213,138,0.08),transparent_50%)]" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35rem] h-[35rem] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center space-y-4 mb-12">
        <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 uppercase px-3 py-1 font-bold text-[10px] tracking-widest rounded-lg">
          Lịch Chiếu Phim Nhanh Chóng & Tiện Lợi
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
          Lịch Chiếu Phim Toàn Hệ Thống
        </h1>
        <p className="text-xs md:text-sm text-white/50 max-w-2xl mx-auto font-medium leading-relaxed">
          Tra cứu nhanh giờ chiếu bom tấn hot nhất, chọn vị trí rạp chiếu ưu thích và mua vé giữ chỗ an toàn chỉ trong 30 giây!
        </p>
      </div>

      {/* Filter Selection Panel */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10 bg-card/50 border border-white/5 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl">
        {/* Theater Select */}
        <div className="lg:col-span-1 space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Chọn Rạp Chiếu</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select
              value={selectedTheaterId}
              onChange={(e) => setSelectedTheaterId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
            >
              {isLoadingTheaters ? (
                <option className="bg-[#1E1910] text-white py-2">Đang tải rạp...</option>
              ) : theaters.length > 0 ? (
                theaters.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#1E1910] text-white py-2">
                    {t.name} ({t.city})
                  </option>
                ))
              ) : (
                <option className="bg-[#1E1910] text-white py-2">Không tìm thấy rạp</option>
              )}
            </select>
          </div>
        </div>

        {/* Date Selector Carousel */}
        <div className="lg:col-span-3 space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Chọn Ngày Chiếu</label>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {calendarDates.map((date, idx) => {
              const isSelected = selectedDateIndex === idx;
              const isToday = idx === 0;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`flex flex-col items-center justify-center p-3 min-w-[75px] h-16 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#fff0b8] via-[#d8a94f] to-[#9b6b24] border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-wider block">
                    {isToday ? 'Hôm nay' : format(date, 'eee', { locale: vi })}
                  </span>
                  <span className="text-sm font-black block mt-0.5">{format(date, 'dd')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Movies Showtimes List */}
      <div className="relative z-10 space-y-8">
        {isLoadingShows ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/40 uppercase tracking-widest font-black">Đang tải lịch chiếu phim...</span>
          </div>
        ) : moviesWithShows.length > 0 ? (
          moviesWithShows.map(({ movie, shows }) => (
            <Card
              key={movie.id}
              className="bg-card/80 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl p-6 md:p-8 hover:border-primary/20 transition-all duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Movie Poster & Meta */}
                <div className="md:col-span-1 space-y-4 flex flex-col md:items-start items-center">
                  <div className="w-40 aspect-[2/3] bg-[#1E1910] rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex-shrink-0 flex items-center justify-center">
                    {movie.poster?.source ? (
                      <img src={movie.poster.source} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-8 h-8 text-white/10" />
                    )}
                  </div>
                  <div className="space-y-2 md:text-left text-center">
                    <div className="flex items-center justify-center md:justify-start gap-1.5 bg-cinema-gold/10 px-2.5 py-1 rounded-lg border border-cinema-gold/20 w-fit">
                      <Star className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
                      <span className="text-[10px] font-bold text-cinema-gold">{movie.rating || '8.5'}</span>
                    </div>
                    <h3 className="text-base font-extrabold uppercase tracking-tight text-white leading-tight">
                      {movie.title}
                    </h3>
                    <p className="text-[10px] text-white/40 font-semibold uppercase">{movie.genre?.join(' • ')}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-white/30 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{movie.duration} phút</span>
                    </div>
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div className="md:col-span-3 space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Sparkles className="w-4 h-4 text-cinema-gold animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Suất chiếu suất sắc</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {shows.map((show) => (
                      <Link 
                        key={show.id} 
                        href={`/booking/${show.id}`} // Links directly to premium live seat booking
                        className="bg-white/5 hover:bg-primary border border-white/10 hover:border-primary rounded-2xl p-4 transition-all duration-300 text-center group"
                      >
                        <span className="text-base font-black text-white group-hover:scale-105 block transition-transform">
                          {format(new Date(show.startTime), 'HH:mm')}
                        </span>
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block mt-1 group-hover:text-white/80">
                          {show.format || '2D Digital'}
                        </span>
                        <span className="text-[8px] text-white/20 font-semibold block mt-0.5 group-hover:text-white/60">
                          Màn hình: {show.screen?.name || 'Standard'}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 text-[9px] text-white/30 italic mt-4">
                    <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Lưu ý: Suất chiếu thực tế có thể chênh lệch 5-10 phút để phục vụ giới thiệu phim. Vui lòng có mặt tại rạp 15 phút trước giờ chiếu.</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="p-20 text-center bg-card/50 border border-white/5 rounded-[2.5rem] backdrop-blur-xl">
            <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold uppercase tracking-wider text-white">Không có suất chiếu nào</h3>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">Hiện tại chưa có suất chiếu được lên lịch tại rạp này cho ngày đã chọn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
