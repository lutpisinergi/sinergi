import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Boxes,
  Users,
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
  UserCheck2,
  Camera,
  TrendingUp,
  MessageSquareWarning,
  SlidersHorizontal,
  Database,
  Bell,
  UserCircle,
  Settings,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { UserRole } from '../../types/index.ts';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Utama' | 'Operasional & Manpower' | 'Rencana & Realisasi' | 'Pelayanan & Kontrol' | 'Sistem';
  badge?: string | number;
  badgeColor?: string;
  rolesAllowed: UserRole[];
}

export const MENU_ITEMS: MenuItem[] = [
  // 1. Dashboard
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    category: 'Utama',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator', 'client'],
  },
  // 2. Input Laporan
  {
    id: 'input_laporan',
    label: 'Input Laporan',
    icon: FilePlus2,
    category: 'Utama',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator'],
  },
  // 3. Rekap Laporan
  {
    id: 'rekap_laporan',
    label: 'Rekap Laporan',
    icon: FileText,
    category: 'Utama',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'client'],
  },

  // Operasional & Manpower
  // 4. Inventory
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    category: 'Operasional & Manpower',
    badge: 'Stok Kritis',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area'],
  },
  // 5. Manpower
  {
    id: 'manpower',
    label: 'Manpower',
    icon: Users,
    category: 'Operasional & Manpower',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'admin_area'],
  },
  // 8. Schedule Off
  {
    id: 'schedule_off',
    label: 'Schedule Off',
    icon: CalendarOff,
    category: 'Operasional & Manpower',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator'],
  },
  // 9. Rekap Kehadiran
  {
    id: 'kehadiran',
    label: 'Rekap Kehadiran',
    icon: UserCheck2,
    category: 'Operasional & Manpower',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator'],
  },

  // Rencana & Realisasi
  // 6. Master Cleaning Program
  {
    id: 'master_program',
    label: 'Master Cleaning Program',
    icon: CalendarCheck2,
    category: 'Rencana & Realisasi',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'admin_area'],
  },
  // 7. Rencana Kerja Bulanan (RKB)
  {
    id: 'rkb',
    label: 'Rencana Kerja Bulanan (RKB)',
    icon: CalendarDays,
    category: 'Rencana & Realisasi',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area'],
  },
  // 10. Laporan Kerja Harian
  {
    id: 'laporan_harian',
    label: 'Laporan Kerja Harian',
    icon: Camera,
    category: 'Rencana & Realisasi',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator', 'client'],
  },
  // 11. Realisasi Pekerjaan
  {
    id: 'realisasi',
    label: 'Realisasi Pekerjaan',
    icon: TrendingUp,
    category: 'Rencana & Realisasi',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'client'],
  },

  // Pelayanan & Kontrol
  // 12. Handling Complain
  {
    id: 'complain',
    label: 'Handling Complain',
    icon: MessageSquareWarning,
    category: 'Pelayanan & Kontrol',
    badge: '1 SLA Urgent',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'client'],
  },
  // 13. Laporan Custom
  {
    id: 'laporan_custom',
    label: 'Laporan Custom',
    icon: SlidersHorizontal,
    category: 'Pelayanan & Kontrol',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'admin_area'],
  },

  // Sistem
  // 14. Master Data
  {
    id: 'master_data',
    label: 'Master Data',
    icon: Database,
    category: 'Sistem',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord'],
  },
  // 15. Notifikasi
  {
    id: 'notifikasi',
    label: 'Notifikasi',
    icon: Bell,
    category: 'Sistem',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator', 'client'],
  },
  // 16. Profile
  {
    id: 'profile',
    label: 'Profile',
    icon: UserCircle,
    category: 'Sistem',
    rolesAllowed: ['direktur', 'om', 'admin_ops', 'area_coord', 'spv', 'team_leader', 'admin_area', 'operator', 'client'],
  },
  // 17. Pengaturan
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    icon: Settings,
    category: 'Sistem',
    rolesAllowed: ['direktur', 'om', 'admin_ops'],
  },
];

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menuId: string) => void;
  userRole: UserRole;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  userRole,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Filter menu items by user role RBAC
  const allowedMenus = MENU_ITEMS.filter((item) => item.rolesAllowed.includes(userRole));

  // Group by category
  const categories: Array<MenuItem['category']> = [
    'Utama',
    'Operasional & Manpower',
    'Rencana & Realisasi',
    'Pelayanan & Kontrol',
    'Sistem',
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-2xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`no-print fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">
              OPS
            </div>
            <div>
              <span className="text-white font-extrabold text-sm tracking-wider">OPSi PORTAL</span>
              <p className="text-[10px] text-emerald-400 font-semibold">Operational System</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
          {categories.map((cat) => {
            const catMenus = allowedMenus.filter((m) => m.category === cat);
            if (catMenus.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {cat}
                </p>
                {catMenus.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectMenu(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all text-left group cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold border shrink-0 ${
                            isActive
                              ? 'bg-emerald-800/80 text-emerald-100 border-emerald-500'
                              : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom System Indicator */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">PT. SINERGI Integra Services</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
          <p className="text-slate-300 mt-0.5">SOP Cleaning & Housekeeping</p>
        </div>
      </aside>
    </>
  );
};
