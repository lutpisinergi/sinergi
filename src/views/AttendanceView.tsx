import React, { useState } from 'react';
import {
  UserCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Printer,
  Mail,
  Users,
  Calendar,
  X,
} from 'lucide-react';
import { UserAccount, KehadiranItem, Karyawan } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import {
  calculateAttendanceSummary,
  formatDateID,
  formatDateTimeID,
} from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface AttendanceViewProps {
  currentUser: UserAccount;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser }) => {
  const [kehadiranList, setKehadiranList] = useState<KehadiranItem[]>(
    StorageService.getKehadiran()
  );
  const karyawanList = StorageService.getKaryawan();
  const areas = StorageService.getAreas();

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters
  const [selectedTanggal, setSelectedTanggal] = useState<string>(todayStr);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Form input state
  const [formKaryawanId, setFormKaryawanId] = useState<string>(karyawanList[0]?.id || '');
  const [formShift, setFormShift] = useState<KehadiranItem['jadwalShift']>('Pagi (06:00-14:00)');
  const [formJamMasuk, setFormJamMasuk] = useState<string>('05:55');
  const [formJamPulang, setFormJamPulang] = useState<string>('14:00');
  const [formStatus, setFormStatus] = useState<KehadiranItem['statusKehadiran']>('Hadir');
  const [formKeterangan, setFormKeterangan] = useState<string>('Standby tugas area koridor');

  // Filter dataset
  const filteredKehadiran = kehadiranList.filter((k) => {
    if (k.tanggal !== selectedTanggal) return false;
    if (selectedAreaId !== 'ALL' && k.areaId !== selectedAreaId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        k.namaKaryawan.toLowerCase().includes(q) ||
        k.nik.toLowerCase().includes(q) ||
        k.areaNama.toLowerCase().includes(q) ||
        k.jadwalShift.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate attendance analytics via pure function
  const summary = calculateAttendanceSummary(filteredKehadiran);

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetKaryawan = karyawanList.find((k) => k.id === formKaryawanId);
    if (!targetKaryawan) return;

    const area = areas.find((a) => a.id === targetKaryawan.areaId) || areas[0];

    // Calculate late minutes if applicable
    let lateMins = 0;
    if (formStatus === 'Terlambat') {
      lateMins = 15; // default 15 mins
    }

    const newRecord: KehadiranItem = {
      id: `ABS-${Date.now()}`,
      tanggal: selectedTanggal,
      areaId: area.id,
      areaNama: area.namaArea,
      clientId: area.clientId,
      karyawanId: targetKaryawan.id,
      nik: targetKaryawan.nik,
      namaKaryawan: targetKaryawan.namaLengkap,
      jadwalShift: formShift,
      jamMasuk: formJamMasuk,
      jamPulang: formJamPulang,
      statusKehadiran: formStatus,
      menitKeterlambatan: lateMins,
      keterangan: formKeterangan,
      petugasInput: currentUser.nama,
      waktuInput: new Date().toISOString(),
    };

    const updated = [newRecord, ...kehadiranList];
    setKehadiranList(updated);
    StorageService.saveKehadiran(updated);
    StorageService.logActivity(
      currentUser,
      'INPUT_ABSENSI',
      'Kehadiran Manpower',
      `Mencatat absensi ${targetKaryawan.namaLengkap} - Status: ${formStatus}`
    );

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Rekapitulasi Kehadiran & Shift Manpower Harian</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {formatDateID(selectedTanggal)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring jadwal shift, keterlambatan, ketidakhadiran, dan tingkat disiplin kehadiran staf lapangan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <input
            type="date"
            value={selectedTanggal}
            onChange={(e) => setSelectedTanggal(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Input Absensi Staf
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak Rekap Kehadiran A4"
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

      {/* Analytics KPI Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Tingkat Kehadiran</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{summary.formattedKehadiran}</p>
          <span className="text-[10px] text-slate-400">{summary.totalHadir} Hadir / {summary.wajibKerja} Wajib</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Tepat Waktu</span>
          <p className="text-xl font-black text-slate-900 mt-1">{summary.hadir} Staf</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Ontime</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Terlambat</span>
          <p className="text-xl font-black text-amber-700 mt-1">{summary.terlambat} Staf</p>
          <span className="text-[10px] text-amber-600 font-semibold">{summary.formattedKeterlambatan} Rate</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Izin / Sakit</span>
          <p className="text-xl font-black text-slate-800 mt-1">{summary.izin + summary.sakit} Staf</p>
          <span className="text-[10px] text-slate-400">Surat Dokter / Izin</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Off Rutin / Cuti</span>
          <p className="text-xl font-black text-slate-800 mt-1">{summary.off + summary.cuti} Staf</p>
          <span className="text-[10px] text-slate-400">Sesuai Roster</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase">Tanpa Keterangan</span>
          <p className="text-xl font-black text-rose-700 mt-1">{summary.alpha} Staf</p>
          <span className="text-[10px] text-rose-600 font-semibold">Alpha (0)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama karyawan, NIK, shift kerja, atau area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {currentUser.areaId === 'ALL' && (
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Staf & NIK</th>
                <th className="py-3 px-4">Area Penempatan</th>
                <th className="py-3 px-4">Jadwal Shift</th>
                <th className="py-3 px-4 text-center">Jam Masuk - Pulang</th>
                <th className="py-3 px-4 text-center">Status Kehadiran</th>
                <th className="py-3 px-4">Keterangan & Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKehadiran.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Belum ada rekaman absensi untuk tanggal {formatDateID(selectedTanggal)}.
                  </td>
                </tr>
              ) : (
                filteredKehadiran.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.namaKaryawan}</p>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{item.nik}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">{item.areaNama}</td>

                    <td className="py-3 px-4 text-slate-700">{item.jadwalShift}</td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-900">{item.jamMasuk}</span>
                      <span className="mx-1 text-slate-400">-</span>
                      <span className="font-mono font-bold text-slate-900">{item.jamPulang}</span>
                      {item.menitKeterlambatan > 0 && (
                        <span className="block text-[10px] text-amber-700 font-bold">
                          +{item.menitKeterlambatan} Menit
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.statusKehadiran === 'Hadir' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Hadir
                        </span>
                      ) : item.statusKehadiran === 'Terlambat' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Terlambat
                        </span>
                      ) : item.statusKehadiran === 'Off' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          Off Rutin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {item.statusKehadiran}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <p>{item.keterangan || '-'}</p>
                      <span className="text-[10px] text-slate-400">Dicatat oleh: {item.petugasInput}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Attendance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserCheck2 className="w-5 h-5 text-emerald-400" />
                <span>Pencatatan Kehadiran Staf</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Karyawan:</label>
                <select
                  value={formKaryawanId}
                  onChange={(e) => setFormKaryawanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {karyawanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.namaLengkap} ({k.nik}) - {k.areaNama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jadwal Shift:</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value as KehadiranItem['jadwalShift'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="Pagi (06:00-14:00)">Pagi (06:00-14:00)</option>
                  <option value="Middle (10:00-18:00)">Middle (10:00-18:00)</option>
                  <option value="Sore (14:00-22:00)">Sore (14:00-22:00)</option>
                  <option value="Malam (22:00-06:00)">Malam (22:00-06:00)</option>
                  <option value="Normal (08:00-17:00)">Normal (08:00-17:00)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Masuk (WIB):</label>
                  <input
                    type="time"
                    value={formJamMasuk}
                    onChange={(e) => setFormJamMasuk(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Pulang (WIB):</label>
                  <input
                    type="time"
                    value={formJamPulang}
                    onChange={(e) => setFormJamPulang(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Kehadiran:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as KehadiranItem['statusKehadiran'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Hadir">Hadir Tepat Waktu</option>
                  <option value="Terlambat">Terlambat Masuk</option>
                  <option value="Izin">Izin Resmi</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Off">Off Rutin</option>
                  <option value="Alpha">Alpha (Tanpa Keterangan)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan:</label>
                <input
                  type="text"
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
                  Simpan Absensi
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
        title="Laporan Rekapitulasi Absensi & Kehadiran Manpower"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode={`Tanggal ${formatDateID(selectedTanggal)}`}
        headers={['Nama Staf', 'NIK', 'Area Site', 'Shift', 'Jam Masuk - Pulang', 'Status Kehadiran']}
        rows={filteredKehadiran.map((k) => [
          k.namaKaryawan,
          k.nik,
          k.areaNama,
          k.jadwalShift,
          `${k.jamMasuk} - ${k.jamPulang}`,
          k.statusKehadiran,
        ])}
        preparedBy="Team Leader / Admin Site"
        checkedBy="Supervisor Menara Thamrin"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Semua Area Site"
        attachmentName={`Rekap_Absensi_${selectedTanggal}.pdf`}
      />
    </div>
  );
};
