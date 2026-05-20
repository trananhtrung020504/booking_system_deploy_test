'use client';

import { User } from '@/types';
import { useLogoutMutation, authAPI } from '@/store/api/authAPI';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearUser } from '@/store/slice/authSlice';
import { LogOut, User as UserIcon, Shield, Menu, Search, Bell, LayoutGrid, ChevronDown } from 'lucide-react';

interface AdminNavbarProps {
  user: User;
  onToggleSidebar?: () => void;
}

export default function AdminNavbar({ user, onToggleSidebar }: AdminNavbarProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearUser());
      dispatch(authAPI.util.resetApiState());
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-card/30 backdrop-blur-md border-b border-border px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8 flex-1">
        <div 
          onClick={onToggleSidebar}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <Menu className="h-5 w-5" />
        </div>
        
        <div className="relative max-w-md w-full hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm phim, rạp, đặt vé..."
            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Localization / Icons */}
        <div className="hidden md:flex items-center gap-4 px-4 border-r border-border mr-2">
           <button className="p-2 hover:bg-muted rounded-full transition-colors relative">
             <Bell className="h-5 w-5 text-muted-foreground" />
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card"></span>
           </button>
           <button className="p-2 hover:bg-muted rounded-full transition-colors">
             <LayoutGrid className="h-5 w-5 text-muted-foreground" />
           </button>
           <div className="flex items-center gap-1 cursor-pointer hover:bg-muted p-1 px-2 rounded-lg transition-colors">
             <span className="text-xl">🇻🇳</span>
             <ChevronDown className="h-3 w-3 text-muted-foreground" />
           </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground">{user.name || user.email}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none">
              Quản trị viên
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-rose-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
               <UserIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="p-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive hover:text-white transition-all duration-300"
          title="Đăng xuất"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
