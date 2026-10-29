import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Mail,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount, RkbItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { calculateRealisasiPercentage } from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface WorkRealizationViewProps {
  currentUser: UserAccount;
  onNavigateMenu: (menuId: string) => void;
}

export const WorkRealizationView: React.FC<WorkRealizationViewProps> = ({
  currentUser,
  onNavigateMenu,
}) => {
  const rkbList = StorageService.getRkb();
  const areas = StorageService.getAreas();

  // Filters
  const [selectedBulan, setSelectedBulan] = useState<number>(10);
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );
  const [filterKategori, setFilterKategori] = useState<string>('ALL');

  // Modals
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Filter dataset
  const filteredRkb = rkbList.filter((r) => {
    if (r.tahun !== selectedTahun || r.bulan !== selectedBulan) return false;
    if (selectedAreaId !== 'ALL' && r.areaId !== selectedAreaId) return false;
    if (filterKategori !== 'ALL' && r.kategoriPekerjaan !== filterKategori) return false;
    return true;
  });

  const totalTarget = filteredRkb.reduce((a, b) => a + b.targetBulanan, 0);
  const totalRealisasi = filteredRkb.reduce((a, b) => a + b.realisasiBulanan, 0);
  const totalSisa = Math.max(0, totalTarget - totalRealisasi);
  const overallStat = calculateRealisasiPercentage(totalRealisasi, totalTarget);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Analisis Realisasi Rencana Kerja (RKB vs Aktual)</span>
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${overallStat.badgeClass}`}>
              {overallStat.formattedPersentase} ({overallStat.statusLabel})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit kuantitas dan kepatuhan penyelesaian program cleaning service sesuai standar SLA ISO 9001
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month & Year Selectors */}
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {[
              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
            ].map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m} {selectedTahun}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak A4</span>
          </button>

          <button
            onClick={() => setIsEmailOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Kirim Rekap</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Target Pekerjaan</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalTarget} Sesi</p>
          <span className="text-[11px] text-slate-500">{filteredRkb.length} Program RKB</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Realisasi Selesai</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalRealisasi} Sesi</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Tervalidasi Supervisor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Belum Terealisasi</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalSisa} Sesi</p>
          <span className="text-[11px] text-slate-400">Jadwal Minggu W4</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Tingkat Pencapaian</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{overallStat.formattedPersentase}</p>
          <span className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded border ${overallStat.badgeClass}`}>
            {overallStat.statusLabel}
          </span>
        </div>
      </div>

      {/* Realization Table with Progress Bars */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Matriks Kuantitas Target vs Selesai Per Pekerjaan
            </h3>
            <p className="text-[11px] text-slate-500">
              Rumus Kuantitas: <code>(Selesai Valid / Target) × 100%</code>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser.areaId === 'ALL' && (
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white cursor-pointer"
              >
                <option value="ALL">Semua Area Penugasan</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.namaArea}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Program & Objek Pekerjaan</th>
                <th className="py-3 px-4">Area Penugasan</th>
                <th className="py-3 px-4 text-center">Target RKB</th>
                <th className="py-3 px-4 text-center">Realisasi</th>
                <th className="py-3 px-4 text-center">Belum Selesai</th>
                <th className="py-3 px-4 w-48">Progress Persentase</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRkb.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Belum ada program untuk periode bulan {selectedBulan}/{selectedTahun}.
                  </td>
                </tr>
              ) : (
                filteredRkb.map((item) => {
                  const stat = calculateRealisasiPercentage(item.realisasiBulanan, item.targetBulanan);
                  const sisa = Math.max(0, item.targetBulanan - item.realisasiBulanan);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.namaPekerjaan}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.lokasiObjek} • PIC: <strong>{item.pic}</strong>
                        </p>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">{item.areaNama}</td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {item.targetBulanan} {item.satuan}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {item.realisasiBulanan} {item.satuan}
                      </td>

                      <td className="py-3 px-4 text-center font-medium text-slate-500">
                        {sisa} {item.satuan}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">{stat.formattedPersentase}</span>
                            <span className="text-[10px] text-slate-400">{item.realisasiBulanan}/{item.targetBulanan}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, stat.persentase)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stat.badgeClass}`}>
                          {stat.statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Print Modal */}
      <ExportPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="Laporan Realisasi Program Kerja Cleaning Service"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode={`Bulan ${selectedBulan} Tahun ${selectedTahun}`}
        headers={['Nama Pekerjaan', 'Lokasi Objek', 'Target', 'Realisasi Selesai', 'Belum Selesai', 'Capaian (%)', 'PIC']}
        rows={filteredRkb.map((r) => [
          r.namaPekerjaan,
          r.lokasiObjek,
          `${r.targetBulanan} ${r.satuan}`,
          `${r.realisasiBulanan} ${r.satuan}`,
          `${Math.max(0, r.targetBulanan - r.realisasiBulanan)} ${r.satuan}`,
          calculateRealisasiPercentage(r.realisasiBulanan, r.targetBulanan).formattedPersentase,
          r.pic,
        ])}
        preparedBy="Supervisor Area Site"
        checkedBy="Area Koordinator"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Menara Thamrin"
        attachmentName={`Laporan_Realisasi_${selectedBulan}_${selectedTahun}.pdf`}
      />
    </div>
  );
};
