'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Chatbot from '@/components/layout/Chatbot';
import SiteFooter from '@/components/layout/SiteFooter';
import FloatingPromoWidget from '@/components/layout/FloatingPromoWidget';
import { useGsapExperience } from '@/hooks/useGsapExperience';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');
  const pageRef = useRef<HTMLElement | null>(null);
  useGsapExperience(pageRef, pathname || '');

  if (isAdminPath) {
    return <main ref={pageRef} className="flex-1 flex flex-col overflow-hidden">{children}</main>;
  }

  return (
    <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <Navbar />
      <main ref={pageRef} className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <SiteFooter />
      <FloatingPromoWidget />
      <Chatbot />
    </div>
  );
}
