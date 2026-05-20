'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Building, Info } from 'lucide-react';
import { useCreateTheaterMutation, useUpdateTheaterMutation, useGetAdminTheatersQuery } from '@/store/api/adminTheaterAPI';
import { toast } from 'sonner';

interface TheaterFormModalProps {
  theaterId?: string | null;
  onClose: () => void;
}

export default function TheaterFormModal({ theaterId, onClose }: TheaterFormModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    city: string;
    location: string;
    logo?: File | null;
  }>({
    name: '',
    city: 'Ho Chi Minh',
    location: '',
    logo: null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: theatersData } = useGetAdminTheatersQuery({ limit: 100 });
  const [createTheater, { isLoading: isCreating }] = useCreateTheaterMutation();
  const [updateTheater, { isLoading: isUpdating }] = useUpdateTheaterMutation();

  useEffect(() => {
    if (theaterId && theatersData) {
      const theater = theatersData.theaters.find(t => t.id === theaterId);
      if (theater) {
        setFormData({
          name: theater.name,
          city: theater.city,
          location: theater.location,
          logo: null,
        });
        if (theater.logo?.source) {
          setLogoPreview(theater.logo.source);
        } else {
          setLogoPreview(null);
        }
      }
    }
  }, [theaterId, theatersData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, logo: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (theaterId) {
        await updateTheater({ id: theaterId, data: formData as any }).unwrap();
        toast.success('Cập nhật rạp thành công!');
      } else {
        await createTheater(formData as any).unwrap();
        toast.success('Thêm rạp mới thành công!');
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save theater:', error);
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi lưu rạp.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <h3 className="text-xl font-bold text-foreground">
            {theaterId ? 'Chỉnh sửa rạp' : 'Thêm rạp mới'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Logo Rạp</label>
            <div
              onClick={() => document.getElementById('logo-upload')?.click()}
              className="relative h-28 w-full bg-background border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden group"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Building className="h-6 w-6 mb-1 opacity-60" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tải logo lên</span>
                </div>
              )}
              <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tên Rạp</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="Ví dụ: Galaxy Nguyễn Du"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Thành phố</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="Ho Chi Minh">TP. Hồ Chí Minh</option>
                <option value="Ha Noi">Hà Nội</option>
                <option value="Da Nang">Đà Nẵng</option>
                <option value="Can Tho">Cần Thơ</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Địa chỉ chi tiết</label>
            <div className="relative">
              <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                required
                rows={3}
                placeholder="Số nhà, đường, quận..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition-all font-bold text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {(isCreating || isUpdating) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                theaterId ? 'Cập nhật' : 'Thêm rạp'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
