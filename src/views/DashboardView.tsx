import React, { useState } from 'react';
import {
  Building2,
  Users,
  Boxes,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Mail,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Flame,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { UserAccount, AreaSite, Client } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import {
  calculateRealisasiPercentage,
  calculateAttendanceSummary,
  calculateTurnoverRate,
  calculateComplainSLA,
  formatNumberID,
} from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface DashboardViewProps {
  currentUser: UserAccount;
  onNavigateMenu: (menuId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigateMenu }) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Load live data
  const clients = StorageService.getClients();
  const areas = StorageService.getAreas();
  const allBarang = StorageService.getBarang();
  const allKaryawan = StorageService.getKaryawan();
  const allRkb = StorageService.getRkb();
  const allKehadiran = StorageService.getKehadiran();
  const allComplains = StorageService.getComplains();

  // Role scoping
  const isExecutive = currentUser.role === 'direktur' || currentUser.role === 'om' || currentUser.role === 'admin_ops';
  const isClient = currentUser.role === 'client';

  // Filter datasets based on selection and role
  const effectiveAreaId = isExecutive ? selectedAreaId : currentUser.areaId;

  const filteredAreas = areas.filter(
    (a) => effectiveAreaId === 'ALL' || a.id === effectiveAreaId
  );

  const filteredBarang = allBarang.filter(
    (b) => effectiveAreaId === 'ALL' || b.areaId === effectiveAreaId
  );

  const filteredKaryawan = allKaryawan.filter(
    (k) => effectiveAreaId === 'ALL' || k.areaId === effectiveAreaId
  );

  const filteredRkb = allRkb.filter(
    (r) => effectiveAreaId === 'ALL' || r.areaId === effectiveAreaId
  );

  const filteredKehadiran = allKehadiran.filter(
    (h) => effectiveAreaId === 'ALL' || h.areaId === effectiveAreaId
  );

  const filteredComplains = allComplains.filter((c) => {
    if (isClient && currentUser.clientId) {
      return c.clientId === currentUser.clientId;
    }
    return effectiveAreaId === 'ALL' || c.areaId === effectiveAreaId;
  });

  // Calculate Metrics
  const totalTargetBulanan = filteredRkb.reduce((acc, curr) => acc + curr.targetBulanan, 0);
  const totalRealisasiBulanan = filteredRkb.reduce((acc, curr) => acc + curr.realisasiBulanan, 0);
  const realisasiStat = calculateRealisasiPercentage(totalRealisasiBulanan, totalTargetBulanan);

  const lowStockItems = filteredBarang.filter((b) => b.stokSaatIni <= b.stokMinimum);
  const attendanceStat = calculateAttendanceSummary(filteredKehadiran);

  // Urgent complaints
  const urgentComplains = filteredComplains.filter(
    (c) => c.status !== 'selesai' && (c.prioritas === 'Darurat' || c.prioritas === 'Tinggi')
  );

  // Monthly trend data (Oktober as current, simulated previous 5 months)
  const monthlyTrends = [
    { bulan: 'Mei', target: 8, realisasi: 8, pct: 100 },
    { bulan: 'Jun', target: 8, realisasi: 7, pct: 87.5 },
    { bulan: 'Jul', target: 9, realisasi: 9, pct: 100 },
    { bulan: 'Ags', target: 10, realisasi: 10, pct: 100 },
    { bulan: 'Sep', target: 7, realisasi: 7, pct: 100 },
    { bulan: 'Okt', target: totalTargetBulanan, realisasi: totalRealisasiBulanan, pct: realisasiStat.persentase },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isExecutive
                ? 'Executive Performance Dashboard — Konsolidasi Seluruh Area'
                : isClient
                ? 'Portal Pemantauan Kebersihan & Pelayanan Client'
                : `Operational Area Dashboard — ${filteredAreas[0]?.namaArea || 'Site'}`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isExecutive
              ? 'Pusat Kendali Kinerja Operasional Nasional'
              : isClient
              ? `Status Kebersihan ${currentUser.nama}`
              : `Monitoring Operasional Site`}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Sistem monitoring cleaning service PT. SINERGI Integra Services dengan standar SLA, manpower terkontrol, dan realisasi pekerjaan transparan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Executive Area Filter */}
          {isExecutive && (
            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Filter Area:</span>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  Semua Area (Nasional)
                </option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                    {a.namaArea}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak A4</span>
          </button>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Kirim Rekap</span>
          </button>
        </div>
      </div>

      {/* SLA Alert Callout if any urgent complains */}
      {urgentComplains.length > 0 && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl shadow-xs flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg mt-0.5">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Peringatan Prioritas SLA Komplain ({urgentComplains.length} Tiket Membutuhkan Respons Segera)
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                {urgentComplains[0].judul} — Lokasi: <strong>{urgentComplains[0].areaNama}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateMenu('complain')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Tindak Lanjuti Sekarang
          </button>
        </div>
      )}

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Realisasi Pekerjaan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Realisasi RKB</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{realisasiStat.formattedPersentase}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${realisasiStat.badgeClass}`}>
              {realisasiStat.statusLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Selesai: <strong>{totalRealisasiBulanan}</strong></span>
            <span>Target: <strong>{totalTargetBulanan}</strong></span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, realisasiStat.persentase)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Manpower & Kehadiran */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kehadiran Staf</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{attendanceStat.formattedKehadiran}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {attendanceStat.hadir} Hadir Hari Ini
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Terlambat: <strong>{attendanceStat.terlambat}</strong></span>
            <span>Total Staf: <strong>{filteredKaryawan.length} Orang</strong></span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, attendanceStat.persentaseKehadiran)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Status Inventory & Chemical */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status Inventory</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{filteredBarang.length} Item</span>
            {lowStockItems.length > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                {lowStockItems.length} Stok Kritis!
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Aman 100%
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Chemical: <strong>{filteredBarang.filter(b => b.jenis === 'chemical').length}</strong></span>
            <span>Mesin/Alat: <strong>{filteredBarang.filter(b => b.jenis === 'mesin' || b.jenis === 'equipment').length}</strong></span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${lowStockItems.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(10, 100 - lowStockItems.length * 20)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Komplain & SLA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tiket Komplain SLA</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{filteredComplains.length} Total</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {filteredComplains.filter(c => c.status === 'selesai').length} Selesai
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Dalam Penanganan: <strong>{filteredComplains.filter(c => c.status !== 'selesai').length}</strong></span>
            <span>Rating Rata-rata: <strong>5.0 ★</strong></span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: '85%' }}
            />
          </div>
        </div>
      </div>

      {/* Main Visual Content Grid: Chart & Priority Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Trend & Area Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Trend Visualizer */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Tren Realisasi Program Cleaning Service Bulanan (2026)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan target rencana kerja vs pekerjaan terselesaikan & terverifikasi SPV
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Tingkat Capaian Rata-rata: 97.9%
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="space-y-3 pt-2">
              {monthlyTrends.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 w-12">{item.bulan} 2026</span>
                    <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                      <span>Target: {item.target} Sesi</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">Realisasi: {item.realisasi} Sesi</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700 w-12 text-right">{item.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Area Site Performance Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Perbandingan Kinerja Antar Area Site</h3>
                <p className="text-xs text-slate-500">Monitoring real-time seluruh lokasi operasional cleaning service</p>
              </div>
              <button
                onClick={() => onNavigateMenu('realisasi')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
              >
                <span>Lihat Detail Realisasi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Nama Area & Client</th>
                    <th className="py-2.5 px-4">Kota</th>
                    <th className="py-2.5 px-4">Koordinator</th>
                    <th className="py-2.5 px-4">Manpower</th>
                    <th className="py-2.5 px-4 text-center">Status Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAreas.map((area) => (
                    <tr key={area.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{area.namaArea}</p>
                        <p className="text-[11px] text-slate-500">{area.clientNama}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{area.lokasiKota}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{area.koordinatorNama}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{area.targetManpower} Org</span>
                        <span className="text-[10px] text-slate-400 block">Min. Off: {area.minimumManpowerOff}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                          100% Sesuai RKB
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Operational Feeds & Action Panel */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Aksi Cepat Operasional</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onNavigateMenu('input_laporan')}
                className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                <span>+ Buat Laporan Harian Bergambar</span>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => onNavigateMenu('complain')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <span>Tangani Tiket Komplain Client</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateMenu('inventory')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <span>Catat Transaksi Chemical & Alat</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateMenu('schedule_off')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <span>Cek Jadwal Libur / Off Staf</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Low Stock Warning Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Peringatan Stok Minimum</span>
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                {lowStockItems.length} Item
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                Semua stok barang dan chemical berada di atas batas aman minimum.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{item.namaBarang}</p>
                      <p className="text-[10px] text-slate-500">
                        Lokasi: {item.lokasiPenyimpanan}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-700 font-black">{item.stokSaatIni} {item.satuan}</span>
                      <span className="text-[9px] text-slate-400 block">Min: {item.stokMinimum}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => onNavigateMenu('inventory')}
              className="w-full text-center text-xs font-bold text-amber-800 hover:text-amber-900 pt-1 block cursor-pointer"
            >
              Buka Modul Inventory & Pengadaan →
            </button>
          </div>

          {/* Active Complaints Feed */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Tiket Komplain Terkini
              </h3>
              <button
                onClick={() => onNavigateMenu('complain')}
                className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer"
              >
                Semua Tiket
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredComplains.slice(0, 3).map((cmp) => {
                const sla = calculateComplainSLA(cmp.tanggalMasuk, cmp.targetResolveHours);
                return (
                  <div
                    key={cmp.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{cmp.noTiket}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${sla.badgeClass}`}>
                        {sla.statusText}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 leading-snug line-clamp-1">{cmp.judul}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{cmp.namaPelapor}</span>
                      <span className="font-semibold text-slate-700 capitalize">
                        {cmp.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Export / Print Modal */}
      <ExportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Laporan Eksekutif Konsolidasi Kinerja Operasional"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama={effectiveAreaId === 'ALL' ? 'Seluruh Indonesia (Konsolidasi)' : 'Menara Thamrin Jakarta'}
        periode="Oktober 2026"
        headers={['Nama Area Site', 'Lokasi', 'Target RKB', 'Realisasi', 'Persentase', 'Manpower', 'Status SLA']}
        rows={filteredAreas.map((a) => [
          a.namaArea,
          a.lokasiKota,
          '7 Sesi',
          '7 Sesi',
          '100%',
          `${a.targetManpower} Staf`,
          'Terpenuhi 100%',
        ])}
        preparedBy={currentUser.nama}
        checkedBy="Operasional Manager"
        approvedBy="Direktur Utama"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        areaNama={effectiveAreaId === 'ALL' ? 'Seluruh Indonesia' : 'Menara Thamrin'}
        attachmentName="Rekap_Konsolidasi_Operasional_Oktober_2026.pdf"
      />
    </div>
  );
};
