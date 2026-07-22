'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  type Voucher,
  type VoucherPayload,
} from '@/store/api/voucherAPI';

interface VoucherFormModalProps {
  voucher?: Voucher | null;
  onClose: () => void;
}

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

const todayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function VoucherFormModal({ voucher, onClose }: VoucherFormModalProps) {
  const isEdit = !!voucher;
  const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] = useUpdateVoucherMutation();

  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!voucher) return;
    setCode(voucher.code);
    setType(voucher.type);
    setValue(String(voucher.value));
    setMinOrder(String(voucher.minOrder));
    setMaxDiscount(voucher.maxDiscount != null ? String(voucher.maxDiscount) : '');
    setUsageLimit(String(voucher.usageLimit));
    setExpiresAt(toDateInputValue(voucher.expiresAt));
    setIsActive(voucher.isActive);
  }, [voucher]);

  const buildPayload = (): VoucherPayload | null => {
    const numericValue = Number(value);
    const numericMinOrder = Number(minOrder || 0);
    const numericMaxDiscount = maxDiscount === '' ? null : Number(maxDiscount);
    const numericUsageLimit = Number(usageLimit || 0);

    if (!code.trim()) {
      toast.error('Vui lòng nhập mã voucher.');
      return null;
    }
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0.');
      return null;
    }
    if (type === 'PERCENT' && numericValue > 100) {
      toast.error('Voucher phần trăm không được vượt quá 100%.');
      return null;
    }
    if (!Number.isFinite(numericMinOrder) || numericMinOrder < 0) {
      toast.error('Đơn tối thiểu không hợp lệ.');
      return null;
    }
    if (numericMaxDiscount !== null && (!Number.isFinite(numericMaxDiscount) || numericMaxDiscount < 0)) {
      toast.error('Mức giảm tối đa không hợp lệ.');
      return null;
    }
    if (!Number.isInteger(numericUsageLimit) || numericUsageLimit < 1) {
      toast.error('Lượt dùng phải lớn hơn 0.');
      return null;
    }
    if (!expiresAt) {
      toast.error('Vui lòng chọn ngày hết hạn.');
      return null;
    }
    if (expiresAt < todayInputValue()) {
      toast.error('Ngày hết hạn không được nằm trong quá khứ.');
      return null;
    }

    return {
      code: code.trim().toUpperCase(),
      type,
      value: numericValue,
      minOrder: numericMinOrder,
      maxDiscount: numericMaxDiscount,
      usageLimit: numericUsageLimit,
      expiresAt,
      isActive,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    try {
      const result = isEdit && voucher
        ? await updateVoucher({ id: voucher.id, data: payload }).unwrap()
        : await createVoucher(payload).unwrap();
      toast.success(result.message);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể lưu voucher.');
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{isEdit ? 'Sửa voucher' : 'Tạo voucher'}</h3>
              <p className="text-xs text-muted-foreground">Dữ liệu được lưu trực tiếp vào hệ thống voucher.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã voucher</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loại giảm</span>
            <select value={type} onChange={(e) => setType(e.target.value as 'PERCENT' | 'FIXED')} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="PERCENT">Giảm theo phần trăm</option>
              <option value="FIXED">Giảm trực tiếp</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Giá trị giảm</span>
            <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đơn tối thiểu</span>
            <input type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Giảm tối đa</span>
            <input type="number" min="0" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="Để trống nếu không giới hạn" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lượt dùng</span>
            <input type="number" min="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ngày hết hạn</span>
            <input type="date" min={todayInputValue()} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
            <span className="text-sm font-bold text-foreground">Đang hoạt động</span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-primary" />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted">
            Hủy
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex min-w-32 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu voucher'}
          </button>
        </div>
      </form>
    </div>
  );
}
