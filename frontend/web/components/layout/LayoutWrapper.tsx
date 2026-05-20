'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Chatbot from '@/components/layout/Chatbot';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  if (isAdminPath) {
    return <main className="flex-1 flex flex-col overflow-hidden">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden relative">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <footer className="border-t border-border/40 py-6 mt-auto w-full">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TrungBooking. Đặt vé xem phim trực tuyến.</p>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
}
