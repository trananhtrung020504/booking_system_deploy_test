'use client';

import { Percent, Gift, Copy, Check, Sparkles, AlertCircle, Ticket, Heart, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetVouchersQuery } from '@/store/api/voucherAPI';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PromotionsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { data: response, isLoading } = useGetVouchersQuery();

  const gradients = [
    'from-[#e50914] via-[#b30710] to-[#80050b]',
    'from-[#d97706] to-[#b45309]',
    'from-[#059669] to-[#047857]',
    'from-[#2563eb] to-[#1d4ed8]',
    'from-[#db2777] to-[#be185d]',
    'from-[#7c3aed] to-[#6d28d9]'
  ];

  const promos = response?.vouchers?.map((v, idx) => ({
    id: v.id,
    title: v.type === 'PERCENT' ? `Ưu Đãi Đặc Biệt - Giảm ${v.value}%` : `Giảm Giá Cực Sốc - Bớt ${v.value.toLocaleString()}đ`,
    description: `Áp dụng giảm ngay ${v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString()} VNĐ`} cho hóa đơn đặt vé xem phim của bạn trên hệ thống RoPhim.`,
    code: v.code,
    minSpend: v.minOrder > 0 ? `Hoá đơn từ ${v.minOrder.toLocaleString()}đ` : 'Không giới hạn',
    expiry: new Date(v.expiresAt).toLocaleDateString('vi-VN'),
    badge: v.type === 'PERCENT' ? `GIẢM ${v.value}%` : `GIẢM ${(v.value / 1000)}K`,
    gradient: gradients[idx % gradients.length]
  })) || [];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã khuyến mãi "${code}" thành công! Áp dụng ngay khi đặt vé.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#06060a] text-white pt-28 pb-16 px-6 md:px-10 max-w-[1450px] mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.06),transparent_50%)]" />
      <div className="absolute bottom-[20%] left-[-10%] w-[35rem] h-[35rem] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center space-y-4 mb-16">
        <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 uppercase px-3 py-1 font-bold text-[10px] tracking-widest rounded-lg">
          Săn Khuyến Mãi - Trải Nghiệm Thả Ga
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
          Chương Trình Khuyến Mãi Cực Hot
        </h1>
        <p className="text-xs md:text-sm text-white/50 max-w-2xl mx-auto font-medium leading-relaxed">
          Tổng hợp tất cả các mã giảm giá vé phim, bắp nước và các đặc quyền hội viên cực đỉnh tại hệ thống rạp chiếu phim RoPhim.
        </p>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/40 uppercase tracking-widest font-black animate-pulse">Đang tải danh sách khuyến mãi...</span>
        </div>
      ) : promos.length > 0 ? (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promos.map((promo) => (
            <Card 
              key={promo.id} 
              className="bg-[#0d0d15]/80 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-primary/30 hover:shadow-primary/5 hover:scale-[1.01] transition-all duration-500 flex flex-col justify-between group"
            >
              {/* Promo Header Graphic */}
              <div className={`h-40 bg-gradient-to-tr ${promo.gradient} p-8 flex flex-col justify-between relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
                <div className="absolute right-[-2rem] bottom-[-2rem] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-[9px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1">
                    {promo.badge}
                  </Badge>
                </div>

                <div className="relative z-10">
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Mã ưu đãi độc quyền</span>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight mt-0.5 line-clamp-1 group-hover:scale-[1.01] transition-transform">{promo.title}</h4>
                </div>
              </div>

              {/* Promo Content */}
              <CardContent className="p-8 flex flex-col justify-between flex-1 space-y-6">
                <p className="text-xs text-white/50 leading-relaxed font-medium min-h-[50px]">{promo.description}</p>
                
                <div className="space-y-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-white/40">
                    <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Điều kiện:</span>
                    <span className="text-white/80 font-bold">{promo.minSpend}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-white/40 border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Hạn dùng:</span>
                    <span className="text-white/80 font-bold">{promo.expiry}</span>
                  </div>
                </div>

              <div className="flex gap-3 pt-2">
                {/* Copy coupon button */}
                <Button 
                  onClick={() => handleCopy(promo.code)}
                  className="flex-1 py-5 h-auto rounded-xl bg-gradient-to-r from-primary to-[#ff4b4b] border border-primary/20 hover:scale-[1.02] shadow-xl shadow-primary/10 text-white text-[11px] font-bold uppercase tracking-wider transition-all gap-2"
                >
                  {copiedCode === promo.code ? (
                    <>
                      <Check className="w-4 h-4 text-white" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" /> Sao chép mã
                    </>
                  )}
                </Button>
                
                {/* Detail View */}
                <Button 
                  variant="outline"
                  onClick={() => toast.info(`Mã ưu đãi "${promo.code}" áp dụng trực tiếp tại bước đặt vé thanh toán. Chúc bạn xem phim vui vẻ!`)}
                  className="border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider px-5 rounded-xl h-auto py-5"
                >
                  Chi tiết
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      ) : (
        <div className="p-20 text-center bg-[#0d0d15]/50 border border-white/5 rounded-[2.5rem] backdrop-blur-xl relative z-10 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold uppercase tracking-wider text-white">Không có khuyến mãi</h3>
          <p className="text-xs text-white/40 mt-1">Hiện tại hệ thống chưa có chương trình ưu đãi nào hoạt động. Vui lòng kiểm tra lại sau!</p>
        </div>
      )}

      {/* Unified Vouchers Info Bar */}
      <div className="relative z-10 mt-16 p-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-2xl">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-white tracking-wide">Bạn có Voucher cần kích hoạt?</h4>
            <p className="text-xs text-white/50 mt-0.5">Nhập mã khuyến mãi trực tiếp tại bước thanh toán vé để nhận chiết khấu tự động tức thì!</p>
          </div>
        </div>
        <Link href="/movies?status=now-showing">
          <Button className="py-4 h-auto rounded-xl bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-8 shadow-2xl transition-all hover:scale-105">
            Đặt vé phim ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
