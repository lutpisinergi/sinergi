import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  Printer,
  Mail,
  Eye,
  Check,
  X,
  Building,
  UserCheck,
} from 'lucide-react';
import { UserAccount, LaporanKerjaHarianItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { formatDateID } from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface DailyReportListViewProps {
  currentUser: UserAccount;
  onNavigateMenu: (menuId: string) => void;
}

export const DailyReportListView: React.FC<DailyReportListViewProps> = ({
  currentUser,
  onNavigateMenu,
}) => {
  const [reports, setReports] = useState<LaporanKerjaHarianItem[]>(
    StorageService.getLaporanHarian()
  );
  const areas = StorageService.getAreas();

  // Filters
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeReportDetail, setActiveReportDetail] = useState<LaporanKerjaHarianItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Supervisor Approval state
  const [spvNotes, setSpvNotes] = useState('');

  const isSupervisorOrAbove =
    currentUser.role === 'spv' ||
    currentUser.role === 'area_coord' ||
    currentUser.role === 'om' ||
    currentUser.role === 'direktur' ||
    currentUser.role === 'admin_ops';

  const isClient = currentUser.role === 'client';

  // Apply filters
  const filteredReports = reports.filter((r) => {
    if (isClient && currentUser.clientId && r.clientId !== currentUser.clientId) {
      return false;
    }
    if (selectedAreaId !== 'ALL' && r.areaId !== selectedAreaId) {
      return false;
    }
    if (filterStatus !== 'ALL' && r.statusPemeriksaan !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.noLaporan.toLowerCase().includes(q) ||
        r.jenisPekerjaan.toLowerCase().includes(q) ||
        r.lokasiObjek.toLowerCase().includes(q) ||
        r.namaPelapor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApproveReport = (reportId: string, isApproved: boolean) => {
    const updated = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          statusPemeriksaan: (isApproved ? 'disetujui_spv' : 'perlu_perbaikan') as LaporanKerjaHarianItem['statusPemeriksaan'],
          catatanSupervisor: spvNotes || (isApproved ? 'Disetujui sesuai SOP kebersihan Sinergi' : 'Perlu diulang pada bagian sudut'),
          diperiksaOleh: currentUser.nama,
          waktuDiperiksa: new Date().toISOString(),
        };
      }
      return r;
    });

    setReports(updated);
    StorageService.saveLaporanHarian(updated);
    StorageService.logActivity(
      currentUser,
      isApproved ? 'APPROVE_LAPORAN_HARIAN' : 'REJECT_LAPORAN_HARIAN',
      'Laporan Kerja Harian',
      `Verifikasi laporan ${reportId} - ${isApproved ? 'Disetujui' : 'Perlu Perbaikan'}`
    );

    setActiveReportDetail(null);
    setSpvNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Rekap & Verifikasi Laporan Kerja Harian Bergambar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar laporan operasional lapangan dengan dokumentasi visual Before, Progress, dan After
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateMenu('input_laporan')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Input Laporan Baru
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak A4</span>
          </button>
          <button
            onClick={() => setIsEmailOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4 text-slate-600" />
            <span>Kirim Email</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari no laporan, pekerjaan, lokasi, atau pelapor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.areaId === 'ALL' && (
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Area Site</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.namaArea}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Status Pemeriksaan</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="disetujui_spv">Disetujui SPV</option>
            <option value="perlu_perbaikan">Perlu Perbaikan</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Laporan & Tanggal</th>
                <th className="py-3 px-4">Area & Lokasi Objek</th>
                <th className="py-3 px-4">Jenis Pekerjaan & Pelapor</th>
                <th className="py-3 px-4 text-center">Foto Bukti</th>
                <th className="py-3 px-4 text-center">Status Verifikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Belum ada laporan kerja harian yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900">{item.noLaporan}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateID(item.tanggal)} • {item.waktu} WIB
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{item.lokasiObjek}</p>
                      <p className="text-[11px] text-slate-500">{item.areaNama}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-emerald-800">{item.jenisPekerjaan}</p>
                      <p className="text-[11px] text-slate-500">
                        Oleh: <strong>{item.namaPelapor}</strong> ({item.jabatanPelapor})
                      </p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {item.fotoBeforeUrl ? (
                          <img
                            src={item.fotoBeforeUrl}
                            alt="Before"
                            className="w-8 h-8 rounded object-cover border border-slate-200"
                            title="Foto Before"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded bg-slate-100 text-slate-400 text-[9px] flex items-center justify-center border border-dashed border-slate-200">
                            -
                          </span>
                        )}
                        {item.fotoAfterUrl ? (
                          <img
                            src={item.fotoAfterUrl}
                            alt="After"
                            className="w-8 h-8 rounded object-cover border border-emerald-300 ring-1 ring-emerald-500"
                            title="Foto After"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded bg-slate-100 text-slate-400 text-[9px] flex items-center justify-center border border-dashed border-slate-200">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.statusPemeriksaan === 'disetujui_spv' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Disetujui SPV</span>
                        </span>
                      ) : item.statusPemeriksaan === 'perlu_perbaikan' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Perlu Perbaikan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu SPV</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveReportDetail(item);
                          setSpvNotes(item.catatanSupervisor || '');
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail & Foto</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Photo Gallery Modal */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {activeReportDetail.noLaporan}
                </span>
                <h3 className="text-sm font-bold text-white">Detail Laporan Kerja Harian</h3>
              </div>
              <button
                onClick={() => setActiveReportDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              {/* Photo Comparison Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2.5 uppercase tracking-wide">
                  Dokumentasi Foto Lapangan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <span className="text-[10px] font-bold text-rose-700 block mb-1">Kondisi BEFORE</span>
                    {activeReportDetail.fotoBeforeUrl ? (
                      <img
                        src={activeReportDetail.fotoBeforeUrl}
                        alt="Before"
                        className="w-full h-40 object-cover rounded-md border border-slate-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-200/60 rounded flex items-center justify-center text-slate-400 italic">
                        Tidak ada foto
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <span className="text-[10px] font-bold text-blue-700 block mb-1">Proses PROGRESS</span>
                    {activeReportDetail.fotoProgressUrl ? (
                      <img
                        src={activeReportDetail.fotoProgressUrl}
                        alt="Progress"
                        className="w-full h-40 object-cover rounded-md border border-slate-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-200/60 rounded flex items-center justify-center text-slate-400 italic">
                        Tidak ada foto
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <span className="text-[10px] font-bold text-emerald-700 block mb-1">Hasil AFTER</span>
                    {activeReportDetail.fotoAfterUrl ? (
                      <img
                        src={activeReportDetail.fotoAfterUrl}
                        alt="After"
                        className="w-full h-40 object-cover rounded-md border border-emerald-400 ring-2 ring-emerald-500/30"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-200/60 rounded flex items-center justify-center text-slate-400 italic">
                        Tidak ada foto
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-400 text-[10px] block">Area Site</span>
                  <span className="font-bold text-slate-800">{activeReportDetail.areaNama}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Client</span>
                  <span className="font-bold text-slate-800">{activeReportDetail.clientNama}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tanggal & Jam</span>
                  <span className="font-bold text-slate-800">
                    {formatDateID(activeReportDetail.tanggal)} • {activeReportDetail.waktu} WIB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pelapor</span>
                  <span className="font-bold text-slate-800">
                    {activeReportDetail.namaPelapor} ({activeReportDetail.jabatanPelapor})
                  </span>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Uraian Pekerjaan:</span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                    {activeReportDetail.uraianPekerjaan}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Hasil Pekerjaan:</span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                    {activeReportDetail.hasilPekerjaan}
                  </p>
                </div>

                {(activeReportDetail.kendala || activeReportDetail.tindakLanjut) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                      <span className="font-bold text-amber-900 block mb-0.5">Kendala:</span>
                      <p className="text-amber-800">{activeReportDetail.kendala || '-'}</p>
                    </div>
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                      <span className="font-bold text-blue-900 block mb-0.5">Tindak Lanjut:</span>
                      <p className="text-blue-800">{activeReportDetail.tindakLanjut || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supervisor Review Panel */}
              {isSupervisorOrAbove && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-xs">
                      Pemeriksaan & Verifikasi Supervisor
                    </span>
                    {activeReportDetail.diperiksaOleh && (
                      <span className="text-[10px] text-emerald-700">
                        Diperiksa oleh: <strong>{activeReportDetail.diperiksaOleh}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Catatan Evaluasi Supervisor:
                    </label>
                    <input
                      type="text"
                      value={spvNotes}
                      onChange={(e) => setSpvNotes(e.target.value)}
                      placeholder="Masukkan catatan feedback atau instruksi perbaikan..."
                      className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => handleApproveReport(activeReportDetail.id, false)}
                      className="px-4 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Minta Perbaikan Ulang
                    </button>
                    <button
                      onClick={() => handleApproveReport(activeReportDetail.id, true)}
                      className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Setujui (Approve)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Print Modal */}
      <ExportPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="Rekapitulasi Laporan Kerja Harian Cleaning Service"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama={selectedAreaId === 'ALL' ? 'Semua Area Operasional' : 'Menara Thamrin Jakarta'}
        periode="Oktober 2026"
        headers={['No Laporan', 'Tanggal', 'Lokasi Objek', 'Jenis Pekerjaan', 'Pelapor', 'Status Pemeriksaan']}
        rows={filteredReports.map((r) => [
          r.noLaporan,
          `${formatDateID(r.tanggal)} ${r.waktu}`,
          r.lokasiObjek,
          r.jenisPekerjaan,
          r.namaPelapor,
          r.statusPemeriksaan === 'disetujui_spv' ? 'Disetujui SPV' : 'Menunggu',
        ])}
        preparedBy="Staff Operasional Site"
        checkedBy="Supervisor Menara Thamrin"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama={selectedAreaId === 'ALL' ? 'Seluruh Area' : 'Menara Thamrin'}
        attachmentName="Rekap_Laporan_Kerja_Harian_Oktober_2026.pdf"
      />
    </div>
  );
};
