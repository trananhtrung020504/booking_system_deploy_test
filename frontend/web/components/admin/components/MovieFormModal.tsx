'use client';

import { useState, useEffect } from 'react';
import { useCreateMovieMutation, useUpdateMovieMutation, useGetMovieByIdQuery } from '@/store/api/adminMovieAPI';
import { CreateMovieParams } from '@/types';
import { toast } from 'sonner';
import { Calendar, Film, Clock, Globe, Shield, Play, Info, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MovieFormModalProps {
  movieId: string | null;
  onClose: () => void;
}

const DEFAULT_GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Romance', 'Thriller', 'Animation', 'Adventure', 'Family'];
const DEFAULT_FORMATS = ['2D', '3D', 'IMAX', '4DX'];
const DEFAULT_LANGUAGES = ['Vietnamese', 'English', 'Korean', 'Japanese', 'Mandarin', 'Thai'];

export default function MovieFormModal({ movieId, onClose }: MovieFormModalProps) {
  const [formData, setFormData] = useState<Partial<CreateMovieParams>>({
    title: '',
    description: '',
    duration: 120,
    genre: [],
    releaseDate: new Date().toISOString().split('T')[0],
    languages: ['Vietnamese'],
    certification: 'PG-13',
    format: ['2D'],
    trailerUrl: '',
    isActive: true,
  });

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [createMovie, { isLoading: isCreating }] = useCreateMovieMutation();
  const [updateMovie, { isLoading: isUpdating }] = useUpdateMovieMutation();
  const { data: movieData } = useGetMovieByIdQuery(movieId!, {
    skip: !movieId,
  });

  // Helper to ensure we have an array of strings
  const ensureArray = (val: any): string[] => {
    if (!val) return [];
    if (typeof val === 'string') {
      let trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try { return JSON.parse(trimmed); } catch (e) {}
      }
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return Array.isArray(val) ? val : [];
  };

  useEffect(() => {
    if (movieId && movieData?.movie) {
      const movie = movieData.movie;
      setFormData({
        title: movie.title || '',
        description: movie.description || '',
        duration: movie.duration || 120,
        genre: ensureArray(movie.genre),
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
        languages: ensureArray(movie.languages),
        certification: movie.certification || 'PG-13',
        format: ensureArray(movie.format),
        trailerUrl: movie.trailerUrl || '',
        isActive: movie.isActive !== false,
      });
      if (movie.poster?.source) setPosterPreview(movie.poster.source);
    }
  }, [movieId, movieData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  const toggleItem = (field: 'genre' | 'format' | 'languages', item: string) => {
    setFormData(prev => {
      const current = ensureArray(prev[field]);
      return {
        ...prev,
        [field]: current.includes(item) ? current.filter(i => i !== item) : [...current, item],
      };
    });
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, poster: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (movieId) {
        await updateMovie({ id: movieId, data: formData as any }).unwrap();
        toast.success('Cập nhật phim thành công!');
      } else {
        await createMovie(formData as CreateMovieParams).unwrap();
        toast.success('Thêm phim mới thành công!');
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi lưu phim.');
    }
  };

  const displayDate = formData.releaseDate ? format(new Date(formData.releaseDate), 'dd/MM/yyyy') : 'Chọn ngày...';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[10000] p-4 md:p-10">
      <div className="bg-zinc-900/90 border border-white/10 rounded-[2.5rem] p-8 max-w-4xl w-full max-h-full overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              {movieId ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
            </h2>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mt-1">Quản lý kho phim điện ảnh</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tên phim</label>
                <div className="relative">
                  <Film className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm text-white" />
                </div>
              </div>

              {/* Duration & Release Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Thời lượng (Phút)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ngày khởi chiếu</label>
                  <div className="relative group cursor-pointer" onClick={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    if (input) (input as any).showPicker?.() || input.click();
                  }}>
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-20" />
                    <input 
                      type="date" 
                      name="releaseDate" 
                      value={formData.releaseDate} 
                      onChange={handleInputChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" 
                    />
                    <div className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white group-hover:border-primary transition-all">
                      {displayDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certification & Trailer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Phân loại (Rating)</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <select name="certification" value={formData.certification} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold text-white appearance-none">
                      <option value="P" className="bg-zinc-900">P - Mọi lứa tuổi</option>
                      <option value="K" className="bg-zinc-900">K - Dưới 13 (Cần PH)</option>
                      <option value="T13" className="bg-zinc-900">T13 - Trên 13 tuổi</option>
                      <option value="T16" className="bg-zinc-900">T16 - Trên 16 tuổi</option>
                      <option value="T18" className="bg-zinc-900">T18 - Trên 18 tuổi</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Trailer (YouTube)</label>
                  <div className="relative">
                    <Play className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} placeholder="https://..." className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Poster */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Poster Phim</label>
                <div onClick={() => document.getElementById('poster-upload')?.click()} className="relative h-[220px] w-full bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group">
                  {posterPreview ? (
                    <img src={posterPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex flex-col items-center text-white/20">
                      <Film className="h-10 w-10 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Tải ảnh lên</span>
                    </div>
                  )}
                  <input id="poster-upload" type="file" accept="image/*" onChange={handlePosterChange} className="hidden" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Mô tả phim</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} required className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-sm text-white/80 resize-none" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Multi-selects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Thể loại</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_GENRES.map(g => (
                    <button key={g} type="button" onClick={() => toggleItem('genre', g)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${ensureArray(formData.genre).includes(g) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ngôn ngữ</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => toggleItem('languages', l)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${ensureArray(formData.languages).includes(l) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Định dạng</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_FORMATS.map(f => (
                    <button key={f} type="button" onClick={() => toggleItem('format', f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${ensureArray(formData.format).includes(f) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-4 border border-white/10 rounded-2xl text-white/70 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-xs">Hủy bỏ</button>
            <button type="submit" disabled={isCreating || isUpdating} className="flex-[2] px-8 py-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-primary/20">
              {isCreating || isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : (movieId ? 'Cập nhật' : 'Thêm phim mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
