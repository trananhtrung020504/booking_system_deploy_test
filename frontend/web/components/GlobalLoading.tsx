'use client';

import { useAppSelector } from '@/store/hooks';
import { useEffect, useState } from 'react';

export default function GlobalLoading() {
  const { globalLoading } = useAppSelector((state) => state.ui);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (globalLoading) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [globalLoading]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center justify-center gap-6 p-8 rounded-3xl bg-[#0a0a0f]/90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-cinema-gold animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-4 rounded-full border-b-2 border-blue-400 animate-spin" style={{ animationDuration: '2s' }}></div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <div className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">
            Đang tải dữ liệu...
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
            Vui lòng đợi trong giây lát
          </div>
        </div>
      </div>
    </div>
  );
}
