'use client';

import { useState } from 'react';
import { useGetCombosQuery, useDeleteComboMutation } from '@/store/api/comboAPI';
import { Loader2, Coffee, Search, Plus, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ComboFormModal from '@/components/admin/components/ComboFormModal';
import { toast } from 'sonner';
import type { Combo } from '@/types';

export default function AdminCombosPage() {
  // Fetch both active and inactive combos for complete admin oversight
  const { data: combos, isLoading } = useGetCombosQuery({ all: true });
  const [deleteCombo, { isLoading: isDeleting }] = useDeleteComboMutation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  const filteredCombos = combos?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = (combo: Combo | null = null) => {
    setSelectedCombo(combo);
    setIsModalOpen(true);
  };

  const handleDeleteCombo = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa gói bắp nước này không? Tất cả dữ liệu ảnh R2 đi kèm sẽ bị dọn dẹp khỏi Cloud.')) {
      try {
        await deleteCombo(id).unwrap();
        toast.success('Đã xóa bắp nước thành công!');
      } catch (error: any) {
        console.error('Delete combo failed:', error);
        toast.error(error?.data?.message || 'Có lỗi xảy ra khi xóa bắp nước.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Bắp nước (Combos)</h2>
          <p className="text-muted-foreground mt-1">Quản lý các gói ăn uống đi kèm khi đặt vé xem phim</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm Combo
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bắp nước theo tên hoặc mô tả chi tiết..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải danh sách bắp nước...</p>
        </div>
      ) : filteredCombos && filteredCombos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => (
            <div 
              key={combo.id} 
              className={`bg-card/50 backdrop-blur-sm border rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col ${
                combo.isActive ? 'border-border hover:border-primary/50' : 'border-dashed border-border/60 opacity-60'
              }`}
            >
              {/* Image Section */}
              <div className="h-48 bg-muted relative overflow-hidden flex-shrink-0">
                {combo.image ? (
                  <img 
                    src={combo.image} 
                    alt={combo.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-rose-500/10 flex items-center justify-center">
                    <Coffee className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                {/* Price tag */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white font-bold text-sm">
                  {formatCurrency(combo.price)}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    {combo.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {combo.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    combo.isActive
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {combo.isActive ? 'Đang hoạt động' : 'Tạm dừng bán'}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenForm(combo)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all"
                      title="Sửa"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCombo(combo.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all disabled:opacity-50"
                      title="Xóa"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card/30 border border-dashed border-border rounded-2xl py-16 text-center">
          <Coffee className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy gói bắp nước nào</h3>
          <p className="text-muted-foreground mt-1 text-sm">Hãy tạo một combo bắp nước mới để bắt đầu chương trình.</p>
        </div>
      )}

      {/* Pop-up Add/Edit Modal */}
      {isModalOpen && (
        <ComboFormModal 
          combo={selectedCombo}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCombo(null);
          }}
        />
      )}
    </div>
  );
}
