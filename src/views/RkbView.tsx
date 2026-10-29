import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Lock,
  Unlock,
  Copy,
  Plus,
  Filter,
  Printer,
  Mail,
  Clock,
  AlertCircle,
  TrendingUp,
  X,
  FileCheck,
} from 'lucide-react';
import { UserAccount, RkbItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { calculateRealisasiPercentage } from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface RkbViewProps {
  currentUser: UserAccount;
}

export const RkbView: React.FC<RkbViewProps> = ({ currentUser }) => {
  const [rkbList, setRkbList] = useState<RkbItem[]>(StorageService.getRkb());
  const areas = StorageService.getAreas();

  // Filters
  const [selectedBulan, setSelectedBulan] = useState<number>(10); // Oktober
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );

  // Modals
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RkbItem | null>(null);
  const [alasanEdit, setAlasanEdit] = useState('');
  const [editTarget, setEditTarget] = useState<number>(1);

  const isManagerOrAbove =
    currentUser.role === 'om' || currentUser.role === 'direktur' || currentUser.role === 'admin_ops';

  const filteredRkb = rkbList.filter((item) => {
    if (item.tahun !== selectedTahun || item.bulan !== selectedBulan) return false;
    if (selectedAreaId !== 'ALL' && item.areaId !== selectedAreaId) return false;
    return true;
  });

  const totalTarget = filteredRkb.reduce((a, b) => a + b.targetBulanan, 0);
  const totalRealisasi = filteredRkb.reduce((a, b) => a + b.realisasiBulanan, 0);
  const summaryStat = calculateRealisasiPercentage(totalRealisasi, totalTarget);

  // Approval action
  const handleToggleApproval = (id: string, newStatus: RkbItem['statusApproval']) => {
    const updated = rkbList.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          statusApproval: newStatus,
        };
      }
      return r;
    });

    setRkbList(updated);
    StorageService.saveRkb(updated);
    StorageService.logActivity(
      currentUser,
      'STATUS_RKB',
      'Rencana Kerja Bulanan',
      `Mengubah status RKB ${id} menjadi ${newStatus}`
    );
  };

  // Copy RKB from previous month
  const handleCopyFromPreviousMonth = () => {
    const prevBulan = selectedBulan === 1 ? 12 : selectedBulan - 1;
    const prevTahun = selectedBulan === 1 ? selectedTahun - 1 : selectedTahun;

    const sourceItems = rkbList.filter((r) => r.tahun === prevTahun && r.bulan === prevBulan);
    if (sourceItems.length === 0) {
      alert(`Tidak ada data RKB pada bulan ${prevBulan}/${prevTahun} untuk disalin.`);
      return;
    }

    const copied = sourceItems.map((r) => ({
      ...r,
      id: `RKB-${selectedTahun}-${selectedBulan}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tahun: selectedTahun,
      bulan: selectedBulan,
      realisasiBulanan: 0,
      statusApproval: 'draft' as const,
      version: 1,
    }));

    const updated = [...rkbList, ...copied];
    setRkbList(updated);
    StorageService.saveRkb(updated);
    StorageService.logActivity(
      currentUser,
      'COPY_RKB',
      'Rencana Kerja Bulanan',
      `Menyalin ${copied.length} item RKB dari bulan ${prevBulan} ke bulan ${selectedBulan}`
    );

    alert(`Berhasil menyalin ${copied.length} item program ke bulan ${selectedBulan}/${selectedTahun}!`);
  };

  // Save Edit Target with Reason
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = rkbList.map((r) => {
      if (r.id === editingItem.id) {
        return {
          ...r,
          targetBulanan: editTarget,
          alasanPerubahan: alasanEdit,
          version: r.version + 1,
          statusApproval: 'direvisi' as const,
        };
      }
      return r;
    });

    setRkbList(updated);
    StorageService.saveRkb(updated);
    StorageService.logActivity(
      currentUser,
      'REVISI_RKB',
      'Rencana Kerja Bulanan',
      `Revisi target RKB ${editingItem.namaPekerjaan} dari ${editingItem.targetBulanan} ke ${editTarget} (Alasan: ${alasanEdit})`
    );

    setEditingItem(null);
    setAlasanEdit('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              <span>Rencana Kerja Bulanan (RKB) Cleaning Service</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Periode Bulan {selectedBulan}/{selectedTahun}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penjabaran target tahunan ke jadwal mingguan (W1–W4) dengan penguncian versi dan approval berjenjang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
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
            onClick={handleCopyFromPreviousMonth}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4 text-emerald-400" />
            <span>Salin RKB Bulan Lalu</span>
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak RKB A4"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsEmailOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Kirim Email"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RKB Summary KPI bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Target RKB Bulan Ini</span>
          <p className="text-xl font-black text-slate-900 mt-1">{totalTarget} Sesi / Putaran</p>
          <span className="text-[11px] text-slate-500">{filteredRkb.length} Program Aktif</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Realisasi Terselesaikan</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{totalRealisasi} Sesi Selesai</p>
          <span className="text-[11px] text-emerald-600 font-medium">Terverifikasi SPV</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Persentase Capaian</span>
          <p className="text-xl font-black text-slate-900 mt-1">{summaryStat.formattedPersentase}</p>
          <span className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded border ${summaryStat.badgeClass}`}>
            {summaryStat.statusLabel}
          </span>
        </div>
      </div>

      {/* RKB Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Jadwal Pelaksanaan Mingguan (W1 - W4)
          </span>
          {currentUser.areaId === 'ALL' && (
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="px-3 py-1 text-xs border border-slate-300 rounded-md bg-white cursor-pointer"
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Program & Objek</th>
                <th className="py-3 px-4 text-center">Jadwal Minggu</th>
                <th className="py-3 px-4 text-center">Target</th>
                <th className="py-3 px-4 text-center">Realisasi</th>
                <th className="py-3 px-4 text-center">Capaian</th>
                <th className="py-3 px-4 text-center">Status Versi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRkb.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Belum ada RKB untuk bulan ini. Silakan salin dari bulan sebelumnya.
                  </td>
                </tr>
              ) : (
                filteredRkb.map((item) => {
                  const stat = calculateRealisasiPercentage(item.realisasiBulanan, item.targetBulanan);
                  const isLocked = item.statusApproval === 'disetujui' || item.statusApproval === 'ditutup';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.namaPekerjaan}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.lokasiObjek} • PIC: <strong>{item.pic}</strong>
                        </p>
                        {item.alasanPerubahan && (
                          <span className="text-[10px] text-amber-700 italic block mt-0.5">
                            Revisi v{item.version}: {item.alasanPerubahan}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5 font-bold text-[10px]">
                          <span className={`w-6 py-0.5 rounded text-center ${item.mingguJadwal.w1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            W1
                          </span>
                          <span className={`w-6 py-0.5 rounded text-center ${item.mingguJadwal.w2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            W2
                          </span>
                          <span className={`w-6 py-0.5 rounded text-center ${item.mingguJadwal.w3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            W3
                          </span>
                          <span className={`w-6 py-0.5 rounded text-center ${item.mingguJadwal.w4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            W4
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {item.targetBulanan} {item.satuan}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {item.realisasiBulanan} {item.satuan}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stat.badgeClass}`}>
                          {stat.formattedPersentase}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          {isLocked ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[9px] bg-slate-100 text-slate-700 border border-slate-300">
                              <Lock className="w-2.5 h-2.5 text-slate-500" />
                              <span>Terkunci v{item.version}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[9px] bg-amber-100 text-amber-800 border border-amber-300">
                              <Unlock className="w-2.5 h-2.5 text-amber-600" />
                              <span>{item.statusApproval}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditTarget(item.targetBulanan);
                              setAlasanEdit('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          {isManagerOrAbove && (
                            <button
                              onClick={() =>
                                handleToggleApproval(
                                  item.id,
                                  item.statusApproval === 'disetujui' ? 'draft' : 'disetujui'
                                )
                              }
                              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                                item.statusApproval === 'disetujui'
                                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                            >
                              {item.statusApproval === 'disetujui' ? 'Buka Kunci' : 'Kunci (Approve)'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Target / Revision Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Revisi Target RKB Bulanan</h3>
              <button onClick={() => setEditingItem(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-900">{editingItem.namaPekerjaan}</p>
                <p className="text-[11px] text-slate-500">
                  Target Saat Ini: {editingItem.targetBulanan} {editingItem.satuan} (Versi {editingItem.version})
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Bulanan Baru:</label>
                <input
                  type="number"
                  min="0"
                  value={editTarget}
                  onChange={(e) => setEditTarget(parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Perubahan / Revisi Jadwal (Wajib):
                </label>
                <textarea
                  rows={3}
                  value={alasanEdit}
                  onChange={(e) => setAlasanEdit(e.target.value)}
                  placeholder="Sesuai Section 9: setiap perubahan jadwal atau target harus mencatat alasan revisi..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Revisi Versi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Print Modal */}
      <ExportPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`Rencana Kerja Bulanan (RKB) Cleaning Service`}
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode={`Bulan ${selectedBulan} Tahun ${selectedTahun}`}
        headers={['Nama Pekerjaan', 'Lokasi Objek', 'W1', 'W2', 'W3', 'W4', 'Target', 'Realisasi', 'Capaian']}
        rows={filteredRkb.map((r) => [
          r.namaPekerjaan,
          r.lokasiObjek,
          r.mingguJadwal.w1 ? '✓' : '-',
          r.mingguJadwal.w2 ? '✓' : '-',
          r.mingguJadwal.w3 ? '✓' : '-',
          r.mingguJadwal.w4 ? '✓' : '-',
          `${r.targetBulanan} ${r.satuan}`,
          `${r.realisasiBulanan} ${r.satuan}`,
          calculateRealisasiPercentage(r.realisasiBulanan, r.targetBulanan).formattedPersentase,
        ])}
        preparedBy="Supervisor Area Site"
        checkedBy="Area Koordinator"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Menara Thamrin Jakarta"
        attachmentName={`RKB_Bulan_${selectedBulan}_${selectedTahun}.pdf`}
      />
    </div>
  );
};
