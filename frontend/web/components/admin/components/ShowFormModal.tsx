'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Clock, Calendar, CheckCircle2, Loader2, Info } from 'lucide-react';
import { 
  useCreateShowMutation, 
  useGetShowByIdQuery, 
  useUpdateShowMutation 
} from '@/store/api/adminShowAPI';
import { useGetAdminMoviesQuery } from '@/store/api/adminMovieAPI';
import { useGetAdminTheatersQuery } from '@/store/api/adminTheaterAPI';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';

interface ShowFormModalProps {
  showId?: string | null;
  onClose: () => void;
}

export default function ShowFormModal({ showId, onClose }: ShowFormModalProps) {
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedTheater, setSelectedTheater] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState<string[]>(['10:00']);
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: moviesData } = useGetAdminMoviesQuery({ limit: 100 });
  const { data: theatersData } = useGetAdminTheatersQuery({ limit: 100 });
  const { data: show, isLoading: isFetching } = useGetShowByIdQuery(showId!, { skip: !showId });

  // Mutations
  const [createShow, { isLoading: isCreating }] = useCreateShowMutation();
  const [updateShow, { isLoading: isUpdating }] = useUpdateShowMutation();

  // Hydrate form if editing
  useEffect(() => {
    if (showId && show) {
      setSelectedMovie(show.movieId || (show.movie as any)?.id || '');
      setSelectedTheater(show.theaterId || (show.theater as any)?.id || '');
      setSelectedDate(format(new Date(show.startTime), 'yyyy-MM-dd'));
      setTimeSlots([format(new Date(show.startTime), 'HH:mm')]);
      setIsActive(show.isActive);
    }
  }, [showId, show]);

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, '12:00']);
  };

  const handleRemoveTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index] = value;
    setTimeSlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie || !selectedTheater || timeSlots.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const theaterObj = theatersData?.theaters.find(t => t.id === selectedTheater);
    const screenId = show?.screenId || theaterObj?.screens?.[0]?.id || '';

    if (!screenId) {
      toast.error('Không tìm thấy phòng chiếu cho rạp này');
      return;
    }

    try {
      if (showId) {
        const firstStartTime = `${selectedDate}T${timeSlots[0]}:00Z`;
        await updateShow({
          id: showId,
          data: {
            movieId: selectedMovie,
            theaterId: selectedTheater,
            screenId,
            startTime: firstStartTime,
            isActive
          }
        }).unwrap();

        if (timeSlots.length > 1) {
          const extraSlots = timeSlots.slice(1);
          const createPromises = extraSlots.map(time => {
            const startTime = `${selectedDate}T${time}:00Z`;
            return createShow({
              movieId: selectedMovie,
              theaterId: selectedTheater,
              screenId,
              startTime,
              isActive
            }).unwrap();
          });
          await Promise.all(createPromises);
          toast.success(`Cập nhật thành công và đã tạo thêm ${extraSlots.length} suất mới!`);
        } else {
          toast.success('Cập nhật suất chiếu thành công!');
        }
      } else {
        const promises = timeSlots.map(time => {
          const startTime = `${selectedDate}T${time}:00Z`;
          return createShow({
            movieId: selectedMovie,
            theaterId: selectedTheater,
            screenId,
            startTime,
            isActive
          }).unwrap();
        });
        await Promise.all(promises);
        toast.success(`Đã tạo thành công ${timeSlots.length} suất chiếu!`);
      }
      onClose();
    } catch (error: any) {
      console.error('Submit failed:', error);
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi lưu suất chiếu.');
    }
  };

  if (showId && isFetching) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#1E1910]/72 backdrop-blur-md">
        <div className="bg-card p-10 rounded-3xl border border-border shadow-2xl flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-bold">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const displayDate = selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy') : '';

  const formatTimeDisplay = (time: string) => {
    try {
      return format(parse(time, 'HH:mm', new Date()), 'hh:mm a');
    } catch (e) {
      return time;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl">
      <div className="relative bg-card w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-cinema-gold/10 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                {showId ? 'Chỉnh sửa suất chiếu' : 'Thêm suất chiếu mới'}
              </h2>
              <p className="text-cinema-gold text-[10px] font-black uppercase tracking-[0.3em] mt-1">Theo phong cách Lotte Cinema</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all group">
              <X className="h-6 w-6 text-white/50 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cinema-gold">Phim</label>
              <select
                required
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm text-white appearance-none"
              >
                <option value="" className="bg-[#1E1910]">Chọn phim...</option>
                {moviesData?.movies.map(movie => (
                  <option key={movie.id} value={movie.id} className="bg-[#1E1910]">{movie.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cinema-gold">Rạp</label>
              <select
                required
                value={selectedTheater}
                onChange={(e) => setSelectedTheater(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm text-white appearance-none"
              >
                <option value="" className="bg-[#1E1910]">Chọn rạp...</option>
                {theatersData?.theaters.map(theater => (
                  <option key={theater.id} value={theater.id} className="bg-[#1E1910]">{theater.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cinema-gold">Ngày chiếu</label>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Định dạng chuẩn VN</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group cursor-pointer" onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input) (input as any).showPicker?.() || input.click();
              }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <Calendar className="h-4 w-4 text-cinema-gold" />
                  <div className="h-4 w-px bg-white/10" />
                </div>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center font-black text-lg text-white group-hover:border-cinema-gold/50 transition-all z-10">
                  {displayDate || 'Chọn ngày...'}
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-cinema-gold/5 border border-cinema-gold/10 rounded-2xl">
                 <Info className="h-5 w-5 text-cinema-gold shrink-0" />
                 <p className="text-[11px] text-cinema-gold/60 leading-tight font-medium">
                   Lịch chiếu sẽ luôn được hiển thị theo định dạng <b>Ngày / Tháng / Năm</b> chuẩn Việt Nam.
                 </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cinema-gold">Danh sách khung giờ</label>
                {showId && (
                  <span className="text-[9px] text-cinema-gold/50 font-black uppercase tracking-tighter">* GIỜ ĐẦU TIÊN SẼ DÙNG ĐỂ CẬP NHẬT SUẤT HIỆN TẠI</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddTimeSlot}
                className="flex items-center gap-2 text-[10px] font-black uppercase bg-cinema-gold/10 text-cinema-gold px-4 py-2 rounded-full hover:bg-cinema-gold/20 transition-all border border-cinema-gold/20"
              >
                <Plus className="h-3 w-3" /> Thêm giờ
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map((slot, index) => (
                <div key={index} className="relative group animate-in slide-in-from-bottom-2 duration-300 h-[56px]">
                  {/* Container for input trigger - Now covers 100% width */}
                  <div 
                    className="absolute left-0 top-0 h-full w-full z-20 cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                      if (input) (input as any).showPicker?.() || input.focus();
                    }}
                  />
                  
                  <input
                    type="time"
                    required
                    value={slot}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-10"
                  />
                  
                  <div className="w-full pl-4 pr-4 h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between font-black text-sm text-white group-hover:border-cinema-gold/50 group-hover:bg-cinema-gold/5 transition-all z-0">
                    <div className="flex items-center gap-3">
                       <Clock className="h-4 w-4 text-cinema-gold" />
                       <div className="h-4 w-px bg-white/10" />
                       <span className="whitespace-nowrap uppercase tracking-tight">{formatTimeDisplay(slot)}</span>
                    </div>
                    <div className="w-8" /> {/* Placeholder for delete button space */}
                  </div>

                  {/* Move Delete Button outside to handle its own z-index independently */}
                  {timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTimeSlot(index);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-cinema-gold/20 text-cinema-gold rounded-lg hover:bg-cinema-gold hover:text-white transition-all z-30 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] group hover:bg-white/10 transition-all duration-500 cursor-pointer" onClick={() => setIsActive(!isActive)}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-primary shadow-[0_0_20px_rgba(246,213,138,0.38)]' : 'bg-[#2A2114]'}`}>
                <CheckCircle2 className={`h-6 w-6 text-white transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100 opacity-20'}`} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white uppercase tracking-tighter">Kích hoạt suất chiếu</h4>
                <p className="text-xs text-white/40 font-medium">Cho phép khách hàng thấy và đặt vé ngay sau khi {showId ? 'cập nhật' : 'tạo'}.</p>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${isActive ? 'bg-primary' : 'bg-[#3A2A14]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${isActive ? 'left-7' : 'left-1'}`} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 border border-white/10 rounded-2xl text-white/70 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="flex-[2] px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95"
            >
              {isCreating || isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                showId ? 'Xác nhận thay đổi' : 'Tạo suất chiếu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
