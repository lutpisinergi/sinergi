/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, ShieldAlert, ArrowLeft } from 'lucide-react';
import { UserAccount, NotificationItem, AppSettings } from './types/index.ts';
import { StorageService } from './services/storage.ts';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, MENU_ITEMS } from './components/layout/Sidebar.tsx';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { DailyReportInputView } from './views/DailyReportInputView.tsx';
import { DailyReportListView } from './views/DailyReportListView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { ManpowerView } from './views/ManpowerView.tsx';
import { MasterCleaningProgramView } from './views/MasterCleaningProgramView.tsx';
import { RkbView } from './views/RkbView.tsx';
import { ScheduleOffView } from './views/ScheduleOffView.tsx';
import { AttendanceView } from './views/AttendanceView.tsx';
import { WorkRealizationView } from './views/WorkRealizationView.tsx';
import { ComplainHandlingView } from './views/ComplainHandlingView.tsx';
import { CustomReportView } from './views/CustomReportView.tsx';
import { MasterDataView } from './views/MasterDataView.tsx';
import { NotificationView } from './views/NotificationView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount>(
    StorageService.getCurrentUser()
  );
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    StorageService.getNotifications()
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(
    StorageService.getSettings()
  );

  // Refresh notifications when storage updates
  const handleRefreshNotifications = () => {
    setNotifications(StorageService.getNotifications());
  };

  const handleRefreshSettings = () => {
    setAppSettings(StorageService.getSettings());
  };

  // Check RBAC permission for the active menu
  const currentMenuItem = MENU_ITEMS.find((m) => m.id === activeMenu);
  const isAllowed = currentMenuItem
    ? currentMenuItem.rolesAllowed.includes(currentUser.role)
    : true;

  // Render view dispatcher
  const renderCurrentView = () => {
    if (!isAllowed) {
      return (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-2xs text-center max-w-lg mx-auto space-y-4 my-12">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Akses Terbatas (RBAC)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Peran Anda sebagai <strong>{currentUser.jabatan}</strong> tidak memiliki otorisasi untuk mengakses menu ini. Seluruh batasan keamanan divalidasi langsung oleh sistem.
            </p>
          </div>
          <button
            onClick={() => setActiveMenu('dashboard')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>
        </div>
      );
    }

    switch (activeMenu) {
      case 'dashboard':
        return <DashboardView currentUser={currentUser} onNavigateMenu={setActiveMenu} />;
      case 'input_laporan':
        return <DailyReportInputView currentUser={currentUser} onSuccessNavigate={setActiveMenu} />;
      case 'rekap_laporan':
        return <DailyReportListView currentUser={currentUser} onNavigateMenu={setActiveMenu} />;
      case 'inventory':
        return <InventoryView currentUser={currentUser} />;
      case 'manpower':
        return <ManpowerView currentUser={currentUser} />;
      case 'master_program':
        return <MasterCleaningProgramView currentUser={currentUser} />;
      case 'rkb':
        return <RkbView currentUser={currentUser} />;
      case 'schedule_off':
        return <ScheduleOffView currentUser={currentUser} />;
      case 'kehadiran':
        return <AttendanceView currentUser={currentUser} />;
      case 'laporan_harian':
        return <DailyReportListView currentUser={currentUser} onNavigateMenu={setActiveMenu} />;
      case 'realisasi':
        return <WorkRealizationView currentUser={currentUser} onNavigateMenu={setActiveMenu} />;
      case 'complain':
        return <ComplainHandlingView currentUser={currentUser} />;
      case 'laporan_custom':
        return <CustomReportView currentUser={currentUser} />;
      case 'master_data':
        return <MasterDataView currentUser={currentUser} />;
      case 'notifikasi':
        return (
          <NotificationView
            currentUser={currentUser}
            onNavigateMenu={setActiveMenu}
            onRefreshNotifications={handleRefreshNotifications}
          />
        );
      case 'profile':
        return (
          <ProfileView
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
          />
        );
      case 'pengaturan':
        return (
          <SettingsView
            currentUser={currentUser}
            onRefreshAppSettings={handleRefreshSettings}
          />
        );
      default:
        return <DashboardView currentUser={currentUser} onNavigateMenu={setActiveMenu} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onUserChange={(usr) => {
          setCurrentUser(usr);
          // If current menu not allowed for the new role, redirect to dashboard
          const nextMenuItem = MENU_ITEMS.find((m) => m.id === activeMenu);
          if (nextMenuItem && !nextMenuItem.rolesAllowed.includes(usr.role)) {
            setActiveMenu('dashboard');
          }
        }}
        notifications={notifications}
        onOpenNotifications={() => setActiveMenu('notifikasi')}
        onNavigateMenu={setActiveMenu}
      />

      {/* Main Body Shell: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeMenu={activeMenu}
          onSelectMenu={(menuId) => setActiveMenu(menuId)}
          userRole={currentUser.role}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Viewport Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Mobile hamburger menu toggle */}
          <div className="no-print lg:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-600" />
              <span>Buka Menu Navigasi OPSi</span>
            </button>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
              {currentMenuItem?.label || activeMenu}
            </span>
          </div>

          {/* Active View */}
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
