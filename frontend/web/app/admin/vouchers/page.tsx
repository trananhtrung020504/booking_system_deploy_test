'use client';

import { useState } from 'react';
import {
  useDeleteVoucherMutation,
  useGetAdminVouchersQuery,
  useToggleVoucherActiveMutation,
  type Voucher,
} from '@/store/api/voucherAPI';
import VoucherFormModal from '@/components/admin/components/VoucherFormModal';
import { Loader2, Tag, Search, Plus, Trash2, Calendar, DollarSign, Percent, Edit, Power, PowerOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminVouchersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: response, isLoading } = useGetAdminVouchersQuery({
    search: searchQuery || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter,
  });
  const [toggleActive, { isLoading: isToggling }] = useToggleVoucherActiveMutation();
  const [deleteVoucher, { isLoading: isDeleting }] = useDeleteVoucherMutation();

  const vouchers = response?.vouchers || [];
  const stats = response?.stats || { total: 0, active: 0, inactive: 0, expired: 0 };

  const handleOpenForm = (voucher: Voucher | null = null) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const result = await toggleActive(voucher.id).unwrap();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể thay đổi trạng thái voucher.');
    }
  };

  const handleDeleteVoucher = async (voucher: Voucher) => {
    const usedCount = voucher._count?.bookings || 0;
    const message = usedCount > 0
      ? 'Voucher đã có lịch sử sử dụng. Hệ thống sẽ chuyển voucher sang tạm dừng thay vì xóa. Tiếp tục?'
      : 'Bạn có chắc muốn xóa voucher này không?';

    if (!window.confirm(message)) return;

    try {
      const result = await deleteVoucher(voucher.id).unwrap();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể xóa voucher.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Vouchers & Khuyến mãi</h2>
          <p className="text-muted-foreground mt-1">Quản lý mã giảm giá và trạng thái sử dụng voucher trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Tạo Voucher
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng voucher', value: stats.total },
          { label: 'Đang hoạt động', value: stats.active },
          { label: 'Tạm dừng', value: stats.inactive },
          { label: 'Hết hạn', value: stats.expired },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card/40 p-4">
            <p className="text-2xl font-black text-foreground">{item.value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo mã voucher..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'true' | 'false')}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Tạm dừng</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải danh sách vouchers...</p>
        </div>
      ) : vouchers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => {
            const isExpired = new Date(voucher.expiresAt) < new Date();
            return (
              <div
                key={voucher.id}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-foreground -translate-x-1" />
                  ))}
                </div>

                <div>
                  <div className="flex justify-between items-start pl-2">
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">
                      {voucher.type === 'PERCENT' ? <Percent className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                      <span className="text-xs font-bold">{voucher.type === 'PERCENT' ? 'Giảm theo %' : 'Giảm trực tiếp'}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isExpired
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : voucher.isActive
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isExpired ? 'Hết hạn' : voucher.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>

                  <div className="mt-4 pl-2">
                    <h3 className="text-2xl font-black text-foreground tracking-wider group-hover:text-primary transition-colors">{voucher.code}</h3>
                    <p className="text-sm font-bold text-foreground/80 mt-1">
                      Giảm {voucher.type === 'PERCENT' ? `${voucher.value}%` : formatCurrency(voucher.value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Đơn hàng tối thiểu: <span className="font-semibold text-foreground/75">{formatCurrency(voucher.minOrder)}</span>
                      {voucher.maxDiscount ? (
                        <>
                          <br />
                          Giảm tối đa: <span className="font-semibold text-foreground/75">{formatCurrency(voucher.maxDiscount)}</span>
                        </>
                      ) : null}
                      <br />
                      Đã dùng: <span className="font-semibold text-foreground/75">{voucher.usedCount}/{voucher.usageLimit}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary/60" />
                    <span>Hết hạn: {format(new Date(voucher.expiresAt), 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenForm(voucher)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all" title="Sửa">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(voucher)}
                      disabled={isToggling}
                      className="p-1.5 text-muted-foreground hover:text-cinema-gold rounded-lg hover:bg-cinema-gold/10 transition-all disabled:opacity-50"
                      title={voucher.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                    >
                      {voucher.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteVoucher(voucher)}
                      disabled={isDeleting}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all disabled:opacity-50"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card/30 border border-dashed border-border rounded-2xl py-16 text-center">
          <Tag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy voucher nào</h3>
          <p className="text-muted-foreground mt-1 text-sm">Hãy tạo một voucher mới để bắt đầu chương trình khuyến mãi.</p>
        </div>
      )}

      {isModalOpen && (
        <VoucherFormModal
          voucher={selectedVoucher}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVoucher(null);
          }}
        />
      )}
    </div>
  );
}
