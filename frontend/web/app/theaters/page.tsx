'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Info, Film, Star, CreditCard, ChevronRight, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetTheatersQuery, useGetCitiesQuery } from '@/store/api/theaterAPI';
import Link from 'next/link';

export default function TheatersPage() {
  const { data: citiesData, isLoading: isLoadingCities } = useGetCitiesQuery();
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Auto-select first city when loaded
  useEffect(() => {
    if (citiesData && citiesData.length > 0 && !selectedCity) {
      setSelectedCity(citiesData[0]);
    }
  }, [citiesData, selectedCity]);

  const { data: theatersResponse, isLoading: isLoadingTheaters } = useGetTheatersQuery(
    { city: selectedCity || undefined, limit: 100 },
    { skip: !selectedCity }
  );

  const cities = citiesData || ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'];
  const filteredTheaters = theatersResponse?.theaters || [];

  return (
    <div className="min-h-screen bg-background text-white pt-28 pb-16 px-6 md:px-10 max-w-[1450px] mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,213,138,0.08),transparent_50%)]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[35rem] h-[35rem] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center space-y-4 mb-16">
        <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 uppercase px-3 py-1 font-bold text-[10px] tracking-widest rounded-lg">
          Hệ Thống Trải Nghiệm Chuẩn Quốc Tế
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
          Hệ Thống Rạp & Giá Vé
        </h1>
        <p className="text-xs md:text-sm text-white/50 max-w-2xl mx-auto font-medium leading-relaxed">
          Khám phá danh sách rạp RoPhim hiện đại trên toàn quốc, tích hợp công nghệ chiếu phim hàng đầu và bảng giá vé dịch vụ chi tiết nhất.
        </p>
      </div>

      {/* City Filters */}
      <div className="relative z-10 flex flex-wrap justify-center gap-3 mb-10">
        {cities.map((city) => (
          <Button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`px-8 py-6 h-auto rounded-2xl font-bold uppercase tracking-wider text-xs border transition-all ${
              selectedCity === city
                ? 'bg-gradient-to-b from-[#fff0b8] via-[#d8a94f] to-[#9b6b24] border-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02]'
                : 'bg-card/60 hover:bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 mr-2" /> {city}
          </Button>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Theater Cards List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
            <Film className="w-5 h-5 text-primary" /> Rạp chiếu phim tại {selectedCity || '...'}
          </h3>
          
          {isLoadingTheaters || isLoadingCities ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-white/40 uppercase font-black">Đang tải danh sách rạp...</span>
            </div>
          ) : filteredTheaters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTheaters.map((theater) => (
                <Card key={theater.id} className="bg-card/80 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-primary/40 hover:shadow-primary/5 transition-all duration-500 group">
                  <CardContent className="p-8 space-y-6 flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-cinema-gold/10 px-2.5 py-1 rounded-lg border border-cinema-gold/20">
                          <Star className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
                          <span className="text-[10px] font-bold text-cinema-gold">4.8</span>
                        </div>
                        <Badge variant="outline" className="border-white/10 text-white/40 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5">
                          {theater.city}
                        </Badge>
                      </div>

                      <h4 className="text-base font-bold text-white uppercase group-hover:text-primary transition-colors duration-300">
                        {theater.name}
                      </h4>

                      <div className="space-y-2 text-xs text-white/50">
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{theater.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                          <span>Hotline: 1900 6017</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {theater.screens && theater.screens.length > 0 ? (
                          theater.screens.map((screen) => (
                            <Badge key={screen.id} variant="outline" className="border-white/10 bg-white/5 text-white/60 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded">
                              {screen.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="border-white/10 bg-white/5 text-white/40 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded">
                            Standard
                          </Badge>
                        )}
                      </div>
                      <Link href={`/movies?status=now-showing`} className="block">
                        <Button className="w-full py-4 h-auto rounded-xl bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-white text-[10px] font-bold uppercase tracking-wider transition-all gap-1.5">
                          Đặt vé ngay <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-card/50 border border-white/5 rounded-[2.5rem] backdrop-blur-xl">
              <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Không có rạp nào tại {selectedCity}</h3>
              <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">Vui lòng chọn thành phố khác hoặc liên hệ bộ phận hỗ trợ.</p>
            </div>
          )}
        </div>

        {/* Right Column - Premium Ticket Pricing Dashboard */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-primary" /> Bảng giá vé RoPhim
          </h3>
          <Card className="bg-card/90 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 to-transparent blur-xl opacity-30" />
            <CardContent className="p-8 space-y-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-cinema-gold animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-cinema-gold">Vé 2D Chuẩn Quốc Tế</span>
              </div>

              {/* Day types and categories */}
              <div className="space-y-6">
                {/* Weekday pricing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-white tracking-wide">Thứ 2 - Thứ 5 (Cả ngày)</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[9px] uppercase px-2 rounded">Tiết kiệm</Badge>
                  </div>
                  <div className="space-y-2.5 bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60 font-semibold">Ghế Standard (Thường)</span>
                      <span className="font-extrabold text-white">85.000đ</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                      <span className="text-white/60 font-semibold">Ghế VIP (Cao cấp)</span>
                      <span className="font-extrabold text-primary">105.000đ</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                      <span className="text-white/60 font-semibold">Ghế Sweetbox (Đôi)</span>
                      <span className="font-extrabold text-white">220.000đ</span>
                    </div>
                  </div>
                </div>

                {/* Weekend pricing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-white tracking-wide">Thứ 6 - Chủ Nhật & Lễ</span>
                    <Badge className="bg-primary/20 text-primary border border-primary/30 font-bold text-[9px] uppercase px-2 rounded">Cao điểm</Badge>
                  </div>
                  <div className="space-y-2.5 bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60 font-semibold">Ghế Standard (Thường)</span>
                      <span className="font-extrabold text-white">105.000đ</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                      <span className="text-white/60 font-semibold">Ghế VIP (Cao cấp)</span>
                      <span className="font-extrabold text-primary">125.000đ</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                      <span className="text-white/60 font-semibold">Ghế Sweetbox (Đôi)</span>
                      <span className="font-extrabold text-white">260.000đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex gap-2.5 p-4 bg-primary/5 border border-primary/10 rounded-2xl text-[10px] text-white/50 leading-relaxed italic">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Lưu ý: Bảng giá trên áp dụng cho vé 2D Standard. Các suất chiếu IMAX, 3D, hoặc suất chiếu sớm đặc biệt có thể áp dụng phụ thu từ 20,000đ đến 50,000đ cho mỗi ghế.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
