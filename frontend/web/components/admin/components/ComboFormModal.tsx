'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCreateComboMutation, useUpdateComboMutation } from '@/store/api/comboAPI';
import { X, Loader2, Upload, Coffee, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { Combo } from '@/types';

interface ComboFormModalProps {
  combo?: Combo | null;
  onClose: () => void;
}

export default function ComboFormModal({ combo, onClose }: ComboFormModalProps) {
  const isEdit = !!combo;
  const [createCombo, { isLoading: isCreating }] = useCreateComboMutation();
  const [updateCombo, { isLoading: isUpdating }] = useUpdateComboMutation();

  // Portal mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageParamUrl, setImageParamUrl] = useState('');

  // Prefill if in edit mode
  useEffect(() => {
    if (combo) {
      setName(combo.name);
      setDescription(combo.description);
      setPrice(combo.price.toString());
      setIsActive(combo.isActive);
      setImagePreview(combo.image || null);
      if (combo.image && !combo.image.includes('r2.cloudflarestorage.com') && !combo.image.includes('r2.')) {
        setImageParamUrl(combo.image);
      }
    }
  }, [combo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn tệp tin ảnh hợp lệ (PNG, JPG, WEBP).');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageParamUrl(''); // Clear text URL if file chosen
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Vui lòng nhập tên combo.');
    if (!description.trim()) return toast.error('Vui lòng nhập mô tả.');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return toast.error('Vui lòng nhập đơn giá hợp lệ.');
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('isActive', isActive ? 'true' : 'false');
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageParamUrl) {
        formData.append('image', imageParamUrl);
      } else if (isEdit && !imagePreview) {
        // If image was cleared
        formData.append('image', '');
      }

      if (isEdit && combo) {
        await updateCombo({ id: combo.id, formData }).unwrap();
        toast.success('Đã cập nhật Combo bắp nước thành công!');
      } else {
        await createCombo(formData).unwrap();
        toast.success('Đã thêm Combo bắp nước mới thành công!');
      }
      onClose();
    } catch (error: any) {
      console.error('Submit combo failed:', error);
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi xử lý.');
    }
  };

  const isLoading = isCreating || isUpdating;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-card/95 border border-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10 animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Coffee className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {isEdit ? 'Chỉnh sửa Combo' : 'Thêm Combo mới'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? 'Chỉnh sửa chi tiết gói ăn uống' : 'Tạo gói ăn uống mới đi kèm đặt vé'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Combo Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tên Combo *</label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Combo Solo, Combo Couple..."
              className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm font-medium"
            />
          </div>

          {/* Combo Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mô tả chi tiết *</label>
            <textarea 
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: 1 Bắp ngọt lớn + 1 Nước ngọt Coca-Cola 32oz..."
              className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Đơn giá (VND) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="75000"
                className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm font-bold"
              />
            </div>
          </div>

          {/* Image Uploader & URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Hình ảnh sản phẩm</label>
            
            {/* Drag & drop preview area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-muted/10 relative group h-40">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-7 w-7 text-muted-foreground/60 group-hover:text-primary transition-colors mb-2" />
                <span className="text-xs font-bold text-foreground">Tải ảnh lên R2 Cloud</span>
                <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP lên tới 10MB</span>
              </div>

              {/* Image Preview / Fallback text */}
              <div className="bg-muted/20 border border-border rounded-2xl flex items-center justify-center overflow-hidden h-40 relative group">
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImageParamUrl('');
                      }}
                      className="absolute top-2.5 right-2.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground/40">
                    <Coffee className="h-10 w-10 mx-auto mb-2" />
                    <span className="text-xs font-medium">Chưa có ảnh</span>
                  </div>
                )}
              </div>
            </div>

            {/* URL input field fallback */}
            <div className="space-y-1 mt-2">
              <span className="text-[10px] text-muted-foreground font-semibold">Hoặc điền địa chỉ ảnh trực tiếp (Static URL):</span>
              <input 
                type="text"
                value={imageParamUrl}
                onChange={(e) => {
                  setImageParamUrl(e.target.value);
                  setImagePreview(e.target.value || null);
                  setImageFile(null); // Clear file uploader if URL text entered
                }}
                placeholder="https://galaxycine.vn/media/combo.png"
                className="w-full px-4 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-xs font-medium"
              />
            </div>
          </div>

          {/* Toggle Active status */}
          <div className="flex items-center justify-between bg-muted/20 border border-border p-4 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-foreground">Trạng thái bán</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cho phép hiển thị khi khách hàng chọn mua bắp nước</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                isActive ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Submit Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 border border-border hover:bg-muted text-foreground text-sm font-bold rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo Combo'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
