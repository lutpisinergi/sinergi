import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Boxes,
  MessageSquareWarning,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Check,
  ChevronRight,
} from 'lucide-react';
import { UserAccount, NotificationItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { formatDateTimeID } from '../utils/calculations.ts';

interface NotificationViewProps {
  currentUser: UserAccount;
  onNavigateMenu: (menuId: string) => void;
  onRefreshNotifications: () => void;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  currentUser,
  onNavigateMenu,
  onRefreshNotifications,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    StorageService.getNotifications()
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    onRefreshNotifications();
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    onRefreshNotifications();
  };

  const getNotificationIcon = (kategori: NotificationItem['kategori'], level: NotificationItem['level']) => {
    if (kategori === 'complain') {
      return <MessageSquareWarning className="w-5 h-5 text-rose-600" />;
    }
    if (kategori === 'inventory') {
      return <Boxes className="w-5 h-5 text-amber-600" />;
    }
    if (kategori === 'rkb') {
      return <CalendarCheck2 className="w-5 h-5 text-emerald-600" />;
    }
    return <Bell className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>Pusat Notifikasi Operasional & Peringatan SLA</span>
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Notifikasi waktu nyata untuk tiket komplain mendekati deadline SLA, stok minimum, dan persetujuan jadwal
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tandai Semua Sudah Dibaca</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 italic text-xs">
            Tidak ada notifikasi saat ini.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                !n.isRead
                  ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    n.level === 'urgent'
                      ? 'bg-rose-100'
                      : n.level === 'warning'
                      ? 'bg-amber-100'
                      : 'bg-emerald-100'
                  }`}
                >
                  {getNotificationIcon(n.kategori, n.level)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-900">{n.judul}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.pesan}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                    {formatDateTimeID(n.waktu)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    title="Tandai sudah dibaca"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    handleMarkAsRead(n.id);
                    onNavigateMenu(n.linkMenu);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Buka Menu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
