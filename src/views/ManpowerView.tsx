import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ArrowRightLeft,
  UserX,
  TrendingDown,
  Search,
  Filter,
  Printer,
  Mail,
  Building,
  CheckCircle2,
  Calendar,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { UserAccount, Karyawan, TurnoverRecord, StatusKaryawan } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import {
  calculateTurnoverRate,
  formatNumberID,
  formatDateID,
} from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface ManpowerViewProps {
  currentUser: UserAccount;
}

export const ManpowerView: React.FC<ManpowerViewProps> = ({ currentUser }) => {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>(StorageService.getKaryawan());
  const [turnoverList, setTurnoverList] = useState<TurnoverRecord[]>(StorageService.getTurnover());
  const areas = StorageService.getAreas();

  // Tab State
  const [activeTab, setActiveTab] = useState<'karyawan' | 'turnover' | 'mutasi'>('karyawan');

  // Filters
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState<Karyawan | null>(null);

  // Form states for new employee
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nik, setNik] = useState(`SIS-2026-${Math.floor(Math.random() * 900 + 100)}`);
  const [jabatan, setJabatan] = useState('Operator Cleaning Service');
  const [targetAreaId, setTargetAreaId] = useState(areas[0]?.id || '');
  const [noHp, setNoHp] = useState('08123456789');
  const [email, setEmail] = useState('');

  // Form states for mutasi
  const [mutasiKeAreaId, setMutasiKeAreaId] = useState(areas[1]?.id || areas[0]?.id);
  const [mutasiJabatanBaru, setMutasiJabatanBaru] = useState('');
  const [mutasiKeterangan, setMutasiKeterangan] = useState('Rotasi rutin penugasan area site');

  // Form states for resign
  const [resignAlasan, setResignAlasan] = useState('Mendapatkan pekerjaan lain / domisili pindah');
  const [penggantiNama, setPenggantiNama] = useState('');
  const [penggantiNik, setPenggantiNik] = useState('');

  // Print & Email
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Filtered employees
  const filteredKaryawan = karyawanList.filter((k) => {
    if (selectedAreaId !== 'ALL' && k.areaId !== selectedAreaId) return false;
    if (filterStatus !== 'ALL' && k.statusKerja !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        k.namaLengkap.toLowerCase().includes(q) ||
        k.nik.toLowerCase().includes(q) ||
        k.jabatan.toLowerCase().includes(q) ||
        k.areaNama.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = karyawanList.filter((k) => k.statusKerja === 'aktif').length;
  const resignCount = karyawanList.filter((k) => k.statusKerja === 'resign').length;

  // Handle Add Employee
  const handleSaveKaryawan = (e: React.FormEvent) => {
    e.preventDefault();
    const targetArea = areas.find((a) => a.id === targetAreaId) || areas[0];

    const newKaryawan: Karyawan = {
      id: `KAR-${Date.now()}`,
      nik,
      namaLengkap,
      jabatan,
      role: 'operator',
      areaId: targetArea.id,
      areaNama: targetArea.namaArea,
      clientId: targetArea.clientId,
      clientNama: targetArea.clientNama,
      tanggalMulaiKerja: new Date().toISOString().split('T')[0],
      statusKerja: 'aktif',
      noHp,
      email: email || `${namaLengkap.toLowerCase().replace(/\s+/g, '.')}@sinergi-services.co.id`,
      riwayatMutasi: [],
    };

    const updated = [newKaryawan, ...karyawanList];
    setKaryawanList(updated);
    StorageService.saveKaryawan(updated);
    StorageService.logActivity(
      currentUser,
      'ADD_KARYAWAN',
      'Manpower',
      `Menambah karyawan baru: ${namaLengkap} (NIK: ${nik}) ke ${targetArea.namaArea}`
    );

    setIsAddModalOpen(false);
    setNamaLengkap('');
  };

  // Handle Mutasi
  const handleSaveMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKaryawan) return;

    const areaTujuan = areas.find((a) => a.id === mutasiKeAreaId) || areas[0];
    const today = new Date().toISOString().split('T')[0];

    const mutasiRecord = {
      tanggal: today,
      dariArea: selectedKaryawan.areaNama,
      keArea: areaTujuan.namaArea,
      dariJabatan: selectedKaryawan.jabatan,
      keJabatan: mutasiJabatanBaru || selectedKaryawan.jabatan,
      keterangan: mutasiKeterangan,
    };

    const updated = karyawanList.map((k) => {
      if (k.id === selectedKaryawan.id) {
        return {
          ...k,
          areaId: areaTujuan.id,
          areaNama: areaTujuan.namaArea,
          clientId: areaTujuan.clientId,
          clientNama: areaTujuan.clientNama,
          jabatan: mutasiJabatanBaru || k.jabatan,
          riwayatMutasi: [mutasiRecord, ...k.riwayatMutasi],
        };
      }
      return k;
    });

    setKaryawanList(updated);
    StorageService.saveKaryawan(updated);
    StorageService.logActivity(
      currentUser,
      'MUTASI_KARYAWAN',
      'Manpower',
      `Mutasi ${selectedKaryawan.namaLengkap} dari ${selectedKaryawan.areaNama} ke ${areaTujuan.namaArea}`
    );

    setIsMutasiModalOpen(false);
    setSelectedKaryawan(null);
  };

  // Handle Resign
  const handleSaveResign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKaryawan) return;

    const today = new Date().toISOString().split('T')[0];

    const updated = karyawanList.map((k) => {
      if (k.id === selectedKaryawan.id) {
        return {
          ...k,
          statusKerja: 'resign' as StatusKaryawan,
          tanggalBerakhirKerja: today,
          alasanResign: resignAlasan,
          karyawanPenggantiNama: penggantiNama || undefined,
          karyawanPenggantiNik: penggantiNik || undefined,
        };
      }
      return k;
    });

    setKaryawanList(updated);
    StorageService.saveKaryawan(updated);
    StorageService.logActivity(
      currentUser,
      'RESIGN_KARYAWAN',
      'Manpower',
      `Pencatatan resign karyawan ${selectedKaryawan.namaLengkap} (Pengganti: ${penggantiNama || 'Belum ada'})`
    );

    setIsResignModalOpen(false);
    setSelectedKaryawan(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Database Manpower, Mutasi & Analisis Turnover</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {activeCount} Staf Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan NIK, riwayat mutasi area, status karyawan, serta formula kalkulasi turnover bulanan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Tambah Karyawan Baru
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak Rekap Manpower A4"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEmailOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Kirim Laporan via Email"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('karyawan')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'karyawan'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Database Karyawan ({filteredKaryawan.length})
        </button>
        <button
          onClick={() => setActiveTab('turnover')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'turnover'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Analisis & Rumus Turnover ({turnoverList.length} Periode)
        </button>
        <button
          onClick={() => setActiveTab('mutasi')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'mutasi'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Riwayat Mutasi Antar-Area
        </button>
      </div>

      {/* TAB 1: Database Karyawan */}
      {activeTab === 'karyawan' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari NIK, nama lengkap staf, jabatan, atau area penempatan..."
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
                  <option value="ALL">Semua Area Penempatan</option>
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
                <option value="ALL">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="resign">Resign / Keluar</option>
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">NIK & Nama Staf</th>
                    <th className="py-3 px-4">Jabatan & Penugasan</th>
                    <th className="py-3 px-4">Area & Client</th>
                    <th className="py-3 px-4">Mulai Bekerja</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKaryawan.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.namaLengkap}</p>
                        <span className="font-mono text-[10px] text-slate-500 font-semibold">{item.nik}</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{item.jabatan}</p>
                        <span className="text-[10px] text-slate-400">{item.noHp}</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-emerald-800">{item.areaNama}</p>
                        <span className="text-[10px] text-slate-500">{item.clientNama}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDateID(item.tanggalMulaiKerja)}
                        {item.tanggalBerakhirKerja && (
                          <span className="block text-[10px] text-rose-600">
                            s/d {formatDateID(item.tanggalBerakhirKerja)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.statusKerja === 'aktif' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Aktif
                          </span>
                        ) : item.statusKerja === 'resign' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Resign
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {item.statusKerja}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {item.statusKerja === 'aktif' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedKaryawan(item);
                                  setIsMutasiModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                                title="Mutasi ke Area Lain"
                              >
                                Mutasi
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedKaryawan(item);
                                  setIsResignModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors cursor-pointer"
                                title="Catat Pengunduran Diri / Resign"
                              >
                                Resign
                              </button>
                            </>
                          )}
                          {item.statusKerja === 'resign' && item.karyawanPenggantiNama && (
                            <span className="text-[10px] text-slate-400 italic">
                              Digantikan: {item.karyawanPenggantiNama}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Analisis & Rumus Turnover */}
      {activeTab === 'turnover' && (
        <div className="space-y-6">
          {/* Transparency Formula Box */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4" />
              <span>Transparansi Rumus & Definisi Perhitungan Turnover Karyawan (Section 7)</span>
            </h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Rumus Standar HRD:</span>
                <p className="font-mono text-sm text-emerald-300 font-bold">
                  Turnover Rate (%) = (Jumlah Karyawan Keluar / Rata-rata Karyawan Aktif) × 100%
                </p>
                <p className="text-[11px] text-slate-300">
                  Rata-rata staf dihitung dari: <code>(Karyawan Awal Bulan + Karyawan Akhir Bulan) ÷ 2</code>
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Pemenuhan Kebutuhan (Headcount):</span>
                <p className="text-xs text-slate-200">
                  Tiap staf yang keluar harus segera dipasangkan dengan <strong>Karyawan Pengganti</strong> untuk menjamin service level agreement (SLA) kebersihan gedung tetap 100% terpenuhi.
                </p>
              </div>
            </div>
          </div>

          {/* Turnover Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Rekapitulasi Turnover Bulanan Per Area Site
              </h3>
              <span className="text-xs text-slate-500 font-medium">Target Turnover: &lt; 5.0% per bulan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Periode Bulan</th>
                    <th className="py-3 px-4">Area Penempatan</th>
                    <th className="py-3 px-4 text-center">Staf Awal</th>
                    <th className="py-3 px-4 text-center">Masuk (+)</th>
                    <th className="py-3 px-4 text-center">Keluar (-)</th>
                    <th className="py-3 px-4 text-center">Staf Akhir</th>
                    <th className="py-3 px-4 text-center">Rata-rata</th>
                    <th className="py-3 px-4 text-center">Turnover Rate</th>
                    <th className="py-3 px-4">Rincian & Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {turnoverList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{t.periodeBulan}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.areaNama}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{t.karyawanAwal}</td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-bold">+{t.karyawanMasuk}</td>
                      <td className="py-3 px-4 text-center text-rose-700 font-bold">-{t.karyawanKeluar}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{t.karyawanAkhir}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{t.rataRataKaryawan}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black px-2.5 py-1 rounded text-xs ${
                            t.turnoverRatePercent > 5
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {t.turnoverRatePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">{t.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Riwayat Mutasi */}
      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Log Perpindahan (Mutasi) & Promosi Jabatan Staf
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Staf & NIK</th>
                  <th className="py-3 px-4">Tanggal Efektif</th>
                  <th className="py-3 px-4">Area Asal → Area Tujuan</th>
                  <th className="py-3 px-4">Perubahan Jabatan</th>
                  <th className="py-3 px-4">Keterangan / Alasan Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {karyawanList
                  .filter((k) => k.riwayatMutasi.length > 0)
                  .flatMap((k) =>
                    k.riwayatMutasi.map((m, idx) => (
                      <tr key={`${k.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{k.namaLengkap}</p>
                          <span className="font-mono text-[10px] text-slate-500">{k.nik}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDateID(m.tanggal)}</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600">{m.dariArea}</span>
                          <span className="mx-2 text-emerald-600 font-bold">→</span>
                          <span className="font-bold text-slate-900">{m.keArea}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-500">{m.dariJabatan}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span className="font-semibold text-emerald-800">{m.keJabatan}</span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">{m.keterangan}</td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Karyawan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Pendaftaran Karyawan Baru</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKaryawan} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Induk Karyawan (NIK):</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Contoh: Surya Pratama"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan:</label>
                  <select
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Operator Cleaning Service">Operator Cleaning Service</option>
                    <option value="Operator Floor Specialist">Operator Floor Specialist</option>
                    <option value="Housekeeper Washroom Specialist">Housekeeper Washroom Specialist</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Supervisor Area">Supervisor Area</option>
                    <option value="Admin Area">Admin Area</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area Penempatan Site:</label>
                  <select
                    value={targetAreaId}
                    onChange={(e) => setTargetAreaId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.namaArea}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Perusahaan (Opsional):</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@sinergi-services.co.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
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
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mutasi Modal */}
      {isMutasiModalOpen && selectedKaryawan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <span>Form Mutasi Penempatan Area</span>
              </h3>
              <button
                onClick={() => setIsMutasiModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMutasi} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-900">{selectedKaryawan.namaLengkap}</p>
                <p className="text-[11px] text-slate-500">
                  {selectedKaryawan.nik} • Saat ini di <strong>{selectedKaryawan.areaNama}</strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pindahkan ke Area Site Baru:</label>
                <select
                  value={mutasiKeAreaId}
                  onChange={(e) => setMutasiKeAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
                >
                  {areas
                    .filter((a) => a.id !== selectedKaryawan.areaId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.namaArea} ({a.lokasiKota})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perubahan Jabatan (Opsional):</label>
                <input
                  type="text"
                  value={mutasiJabatanBaru}
                  onChange={(e) => setMutasiJabatanBaru(e.target.value)}
                  placeholder={`Tetap: ${selectedKaryawan.jabatan}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan / SK Mutasi:</label>
                <textarea
                  rows={2}
                  value={mutasiKeterangan}
                  onChange={(e) => setMutasiKeterangan(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMutasiModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Konfirmasi Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resign Modal */}
      {isResignModalOpen && selectedKaryawan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserX className="w-5 h-5 text-rose-400" />
                <span>Pencatatan Resign & Karyawan Pengganti</span>
              </h3>
              <button
                onClick={() => setIsResignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResign} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="font-bold text-slate-900">{selectedKaryawan.namaLengkap}</p>
                <p className="text-[11px] text-slate-500">
                  {selectedKaryawan.nik} • {selectedKaryawan.areaNama}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan Pengunduran Diri:</label>
                <textarea
                  rows={2}
                  value={resignAlasan}
                  onChange={(e) => setResignAlasan(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold text-slate-800 text-[11px] block">
                  Karyawan Pengganti (Pemenuhan Kuota Headcount):
                </span>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nama Karyawan Pengganti:</label>
                  <input
                    type="text"
                    value={penggantiNama}
                    onChange={(e) => setPenggantiNama(e.target.value)}
                    placeholder="Contoh: Rian Saputra"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">NIK Pengganti:</label>
                  <input
                    type="text"
                    value={penggantiNik}
                    onChange={(e) => setPenggantiNik(e.target.value)}
                    placeholder="SIS-2026-XXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsResignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Status Resign
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
        title="Rekapitulasi Manpower & Karyawan Operasional"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode="Oktober 2026"
        headers={['NIK', 'Nama Lengkap', 'Jabatan', 'Area Site', 'Mulai Kerja', 'Status']}
        rows={filteredKaryawan.map((k) => [
          k.nik,
          k.namaLengkap,
          k.jabatan,
          k.areaNama,
          formatDateID(k.tanggalMulaiKerja),
          k.statusKerja,
        ])}
        preparedBy="Admin HRD & Manpower Ops"
        checkedBy="Operasional Manager"
        approvedBy="Direktur Utama"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Konsolidasi Manpower Nasional"
        attachmentName="Rekap_Manpower_Turnover_Oktober_2026.pdf"
      />
    </div>
  );
};
