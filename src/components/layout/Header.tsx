import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  ShieldCheck,
  ChevronDown,
  Building,
  UserCheck,
  LogOut,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserAccount, NotificationItem } from '../../types/index.ts';
import { StorageService } from '../../services/storage.ts';
import { INITIAL_USERS } from '../../services/mockData.ts';

interface HeaderProps {
  currentUser: UserAccount;
  onUserChange: (user: UserAccount) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onNavigateMenu: (menuId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  notifications,
  onOpenNotifications,
  onNavigateMenu,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      const dateStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);
      setCurrentTime(`${dateStr} • ${timeStr} WIB`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'direktur':
        return { label: 'Direktur Utama', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'om':
        return { label: 'Operasional Manager', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'admin_ops':
        return { label: 'Admin Operasional', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'area_coord':
        return { label: 'Area Koordinator', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'spv':
        return { label: 'Supervisor Area', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'team_leader':
        return { label: 'Team Leader', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'admin_area':
        return { label: 'Admin Area', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'operator':
        return { label: 'Operator / Cleaner', color: 'bg-slate-100 text-slate-800 border-slate-200' };
      case 'client':
        return { label: 'Client / Pelanggan', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Active Area Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              SIS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">OPSi</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  v2.6 Enterprise
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                PT. SINERGI Integra Services — Divisi Operasional
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Area Scope Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Cakupan Area:</span>
            <span className="font-bold text-slate-800">
              {currentUser.areaId === 'ALL'
                ? 'Seluruh Indonesia (Nasional)'
                : 'Menara Thamrin (Jakarta)'}
            </span>
          </div>
        </div>

        {/* Right: Live Clock, Role Switcher, Notifications & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Real-time Clock */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 font-medium font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentTime || 'Memuat waktu...'}</span>
          </div>

          {/* Role Quick-Switcher Modal/Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Ganti Peran / Akun Pengguna untuk Pengujian Akses"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentBadge.color}`}>
                {currentBadge.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleSelector && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Pilih Akun / Hak Akses (RBAC)
                  </span>
                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                    9 Role
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-100">
                  {INITIAL_USERS.map((usr) => {
                    const badge = getRoleBadge(usr.role);
                    const isSelected = usr.id === currentUser.id;
                    return (
                      <button
                        key={usr.id}
                        onClick={() => {
                          onUserChange(usr);
                          StorageService.setCurrentUser(usr);
                          setShowRoleSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-start space-x-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 mt-0.5">
                          {usr.nama.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800 truncate">{usr.nama}</p>
                            {isSelected && <span className="text-[10px] text-emerald-700 font-bold">Aktif</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{usr.jabatan}</p>
                          <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-400 flex items-center space-x-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  <span>Masing-masing role menerapkan batasan data & hak akses.</span>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
            title="Lihat Notifikasi Operasional & SLA"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Info */}
          <div className="flex items-center space-x-2 pl-1 border-l border-slate-200">
            <button
              onClick={() => onNavigateMenu('profile')}
              className="flex items-center space-x-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
              title="Buka Profil Pengguna"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentUser.nama.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.nama}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{currentUser.jabatan}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
