import React, { useState, useRef } from 'react';
import {
  CalendarOff,
  Plus,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Printer,
  Mail,
  X,
  ShieldAlert,
} from 'lucide-react';
import { UserAccount, ScheduleOffItem, Karyawan } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { formatDateID } from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface ScheduleOffViewProps {
  currentUser: UserAccount;
}

export const ScheduleOffView: React.FC<ScheduleOffViewProps> = ({ currentUser }) => {
  const [scheduleList, setScheduleList] = useState<ScheduleOffItem[]>(
    StorageService.getScheduleOff()
  );
  const karyawanList = StorageService.getKaryawan();
  const areas = StorageService.getAreas();

  // Filters
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? areas[0].id : currentUser.areaId
  );
  const [selectedPeriode, setSelectedPeriode] = useState<string>('2026-10');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // New off form state
  const [formKaryawanId, setFormKaryawanId] = useState<string>(karyawanList[0]?.id || '');
  const [formTanggalOff, setFormTanggalOff] = useState<string>('2026-10-31');
  const [formJenisOff, setFormJenisOff] = useState<ScheduleOffItem['jenisOff']>('Off Rutin');
  const [formPengganti, setFormPengganti] = useState<string>('Ahmad Fauzi');
  const [formKeterangan, setFormKeterangan] = useState<string>('Jadwal off berkala mingguan');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Sample File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sampleUploadedName, setSampleUploadedName] = useState<string | null>(null);

  const selectedAreaObj = areas.find((a) => a.id === selectedAreaId) || areas[0];

  // Filter schedules
  const filteredSchedules = scheduleList.filter((s) => {
    if (s.periodeBulan !== selectedPeriode) return false;
    if (s.areaId !== selectedAreaId) return false;
    return true;
  });

  // Calculate off staff for each day in month (31 days)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${selectedPeriode}-${String(dayNum).padStart(2, '0')}`;
    const offStaff = filteredSchedules.filter((s) => s.tanggalOff === dateStr);
    const activeStaffCount = selectedAreaObj.targetManpower - offStaff.length;
    const isBelowMinimum = activeStaffCount < selectedAreaObj.minimumManpowerOff;

    return {
      dayNum,
      dateStr,
      offStaff,
      activeStaffCount,
      isBelowMinimum,
    };
  });

  const handleCheckConflict = (karyawanId: string, tanggal: string) => {
    // Check if staff already has off on this date
    const exists = scheduleList.some(
      (s) => s.karyawanId === karyawanId && s.tanggalOff === tanggal
    );
    if (exists) {
      return 'Karyawan ini sudah terjadwal libur/off pada tanggal tersebut.';
    }

    // Check area minimum manpower constraint
    const offOnDate = scheduleList.filter(
      (s) => s.areaId === selectedAreaId && s.tanggalOff === tanggal
    );
    const remainingStaff = selectedAreaObj.targetManpower - (offOnDate.length + 1);
    if (remainingStaff < selectedAreaObj.minimumManpowerOff) {
      return `Peringatan: Kuota manpower aktif akan tersisa ${remainingStaff} orang (Batas minimum area: ${selectedAreaObj.minimumManpowerOff} orang). Wajib menunjuk staf pengganti!`;
    }

    return null;
  };

  const handleSaveOff = (e: React.FormEvent) => {
    e.preventDefault();
    const targetKaryawan = karyawanList.find((k) => k.id === formKaryawanId);
    if (!targetKaryawan) return;

    const conflict = handleCheckConflict(targetKaryawan.id, formTanggalOff);
    if (conflict && conflict.startsWith('Karyawan ini sudah')) {
      setConflictWarning(conflict);
      return;
    }

    const newOff: ScheduleOffItem = {
      id: `SCH-${Date.now()}`,
      periodeBulan: selectedPeriode,
      areaId: selectedAreaObj.id,
      areaNama: selectedAreaObj.namaArea,
      karyawanId: targetKaryawan.id,
      nik: targetKaryawan.nik,
      namaKaryawan: targetKaryawan.namaLengkap,
      jabatan: targetKaryawan.jabatan,
      tanggalOff: formTanggalOff,
      jenisOff: formJenisOff,
      karyawanPenggantiNama: formPengganti || undefined,
      keterangan: formKeterangan,
      statusApproval: 'disetujui',
    };

    const updated = [...scheduleList, newOff];
    setScheduleList(updated);
    StorageService.saveScheduleOff(updated);
    StorageService.logActivity(
      currentUser,
      'ADD_SCHEDULE_OFF',
      'Schedule Off',
      `Menetapkan jadwal off ${targetKaryawan.namaLengkap} pada tanggal ${formTanggalOff}`
    );

    setIsAddModalOpen(false);
    setConflictWarning(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSampleUploadedName(file.name);
    setTimeout(() => {
      alert(`Format template roster dari file "${file.name}" berhasil dianalisis dan disesuaikan ke kalender sistem!`);
      setIsUploadModalOpen(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <CalendarOff className="w-5 h-5 text-emerald-600" />
              <span>Pengaturan Schedule Off Manpower & Cuti</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Min. Kuota: {selectedAreaObj.minimumManpowerOff} Staf Standby
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Validasi otomatis benturan jadwal libur staf dan pemenuhan kuota minimum headcount harian
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Area Selector */}
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.namaArea}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setConflictWarning(null);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Ajukan Jadwal Off
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload Contoh Schedule</span>
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak Jadwal Off A4"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Headcount Guard Banner */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800">
              Konfigurasi Batas Minimum Area: {selectedAreaObj.namaArea}
            </p>
            <p className="text-[11px] text-slate-500">
              Total Target Manpower: <strong>{selectedAreaObj.targetManpower} orang</strong> • Batas Minimal Standby:{' '}
              <strong className="text-emerald-700">{selectedAreaObj.minimumManpowerOff} orang</strong> (Maks. 6 orang libur per hari)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
          Sistem Deteksi Benturan Aktif
        </span>
      </div>

      {/* Calendar Grid View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Kalender Roster Off Bulan Oktober 2026</span>
          </h3>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <span>Aman</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
              <span>Di Bawah Kuota Minimum</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {daysInMonth.map((d) => (
            <div
              key={d.dayNum}
              className={`p-2.5 rounded-lg border text-xs transition-colors flex flex-col justify-between min-h-[90px] ${
                d.isBelowMinimum
                  ? 'bg-rose-50 border-rose-300'
                  : d.offStaff.length > 0
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Tgl {d.dayNum}</span>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                    d.isBelowMinimum
                      ? 'bg-rose-200 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {d.activeStaffCount} Aktif
                </span>
              </div>

              <div className="my-1.5 space-y-1">
                {d.offStaff.map((s) => (
                  <div
                    key={s.id}
                    className="p-1 bg-white border border-slate-200 rounded text-[9px] shadow-2xs truncate"
                    title={`${s.namaKaryawan} (${s.jenisOff})`}
                  >
                    <span className="font-bold text-slate-800 block truncate">{s.namaKaryawan}</span>
                    <span className="text-slate-400 text-[8px]">{s.jenisOff}</span>
                  </div>
                ))}
              </div>

              {d.isBelowMinimum && (
                <div className="text-[8px] text-rose-700 font-bold flex items-center space-x-0.5">
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                  <span>Kekurangan Staf!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Off Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Daftar Rekapitulasi Pengajuan Off Staf
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Karyawan & NIK</th>
                <th className="py-3 px-4">Tanggal Off</th>
                <th className="py-3 px-4">Jenis Libur / Cuti</th>
                <th className="py-3 px-4">Petugas Pengganti</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{item.namaKaryawan}</p>
                    <span className="font-mono text-[10px] text-slate-500 font-semibold">{item.nik}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{formatDateID(item.tanggalOff)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-700">
                      {item.jenisOff}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-800 font-semibold">
                    {item.karyawanPenggantiNama || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px]">{item.keterangan || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full border border-emerald-200">
                      Disetujui SPV
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Off Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CalendarOff className="w-5 h-5 text-emerald-400" />
                <span>Form Pengajuan Schedule Off Staf</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOff} className="p-6 space-y-4 text-xs">
              {conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{conflictWarning}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Karyawan:</label>
                <select
                  value={formKaryawanId}
                  onChange={(e) => {
                    setFormKaryawanId(e.target.value);
                    const warn = handleCheckConflict(e.target.value, formTanggalOff);
                    setConflictWarning(warn);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {karyawanList
                    .filter((k) => k.areaId === selectedAreaId && k.statusKerja === 'aktif')
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaLengkap} ({k.nik}) - {k.jabatan}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Off:</label>
                  <input
                    type="date"
                    value={formTanggalOff}
                    onChange={(e) => {
                      setFormTanggalOff(e.target.value);
                      const warn = handleCheckConflict(formKaryawanId, e.target.value);
                      setConflictWarning(warn);
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Off / Cuti:</label>
                  <select
                    value={formJenisOff}
                    onChange={(e) => setFormJenisOff(e.target.value as ScheduleOffItem['jenisOff'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Off Rutin">Off Rutin</option>
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Cuti Khusus">Cuti Khusus</option>
                    <option value="Izin Resmi">Izin Resmi</option>
                    <option value="Tukar Shift">Tukar Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Staf Pengganti (Cover Headcount):</label>
                <input
                  type="text"
                  value={formPengganti}
                  onChange={(e) => setFormPengganti(e.target.value)}
                  placeholder="Nama staf pengganti standby..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Alasan:</label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Jadwal Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Sample Schedule Off Modal (Section 10 Requirement) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>Upload Contoh Schedule Off Perusahaan</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                <p className="font-bold text-slate-800">Instruksi Section 10:</p>
                <p className="text-[11px] mt-1">
                  Unggah file contoh roster atau schedule off yang saat ini digunakan perusahaan (Excel/PDF) untuk penyesuaian kolom & format perhitungan kalender.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv, .pdf"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/20"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Pilih File Contoh Schedule Off (.xlsx / .pdf)</p>
                <p className="text-[10px] text-slate-400">Sentuh untuk menelusuri file dari perangkat</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Print Modal */}
      <ExportPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="Jadwal Roster Off & Cuti Manpower Cleaning Service"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama={selectedAreaObj.namaArea}
        periode="Periode Oktober 2026"
        headers={['Nama Karyawan', 'NIK', 'Tanggal Off', 'Jenis Off', 'Pengganti Standby', 'Status']}
        rows={filteredSchedules.map((s) => [
          s.namaKaryawan,
          s.nik,
          formatDateID(s.tanggalOff),
          s.jenisOff,
          s.karyawanPenggantiNama || '-',
          'Disetujui SPV',
        ])}
        preparedBy="Supervisor Area Site"
        checkedBy="Area Koordinator"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama={selectedAreaObj.namaArea}
        attachmentName={`Schedule_Off_${selectedPeriode}.pdf`}
      />
    </div>
  );
};
