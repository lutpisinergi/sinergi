import React, { useState } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserAccount, LaporanKerjaHarianItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { ImageUploadModal } from '../components/modals/ImageUploadModal.tsx';

interface DailyReportInputViewProps {
  currentUser: UserAccount;
  onSuccessNavigate?: (menuId: string) => void;
}

export const DailyReportInputView: React.FC<DailyReportInputViewProps> = ({
  currentUser,
  onSuccessNavigate,
}) => {
  const areas = StorageService.getAreas();
  const clients = StorageService.getClients();

  const defaultArea =
    currentUser.areaId !== 'ALL'
      ? areas.find((a) => a.id === currentUser.areaId) || areas[0]
      : areas[0];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const autoNoLaporan = `LKH/${defaultArea.kode}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

  // Form State
  const [noLaporan, setNoLaporan] = useState(autoNoLaporan);
  const [tanggal, setTanggal] = useState(todayStr);
  const [waktu, setWaktu] = useState(timeStr);
  const [areaId, setAreaId] = useState(defaultArea.id);
  const [namaPelapor, setNamaPelapor] = useState(currentUser.nama);
  const [jabatanPelapor, setJabatanPelapor] = useState(currentUser.jabatan);
  const [jenisPekerjaan, setJenisPekerjaan] = useState('Floor Buffing & Crystallization');
  const [lokasiObjek, setLokasiObjek] = useState('Lobby Utama & Selasar Lift');
  const [uraianPekerjaan, setUraianPekerjaan] = useState('');
  const [hasilPekerjaan, setHasilPekerjaan] = useState('');
  const [kendala, setKendala] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');

  // Photos
  const [fotoBefore, setFotoBefore] = useState<string>('');
  const [fotoProgress, setFotoProgress] = useState<string>('');
  const [fotoAfter, setFotoAfter] = useState<string>('');

  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState<'before' | 'progress' | 'after'>('before');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedAreaObj = areas.find((a) => a.id === areaId) || areas[0];
  const selectedClientObj = clients.find((c) => c.id === selectedAreaObj.clientId) || clients[0];

  const handleOpenPhotoModal = (slot: 'before' | 'progress' | 'after') => {
    setActivePhotoSlot(slot);
    setModalUploadOpen(true);
  };

  const handlePhotoCaptured = (url: string, type: 'before' | 'progress' | 'after') => {
    if (type === 'before') setFotoBefore(url);
    if (type === 'progress') setFotoProgress(url);
    if (type === 'after') setFotoAfter(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uraianPekerjaan.trim()) {
      setValidationError('Uraian pekerjaan wajib diisi.');
      return;
    }
    if (!hasilPekerjaan.trim()) {
      setValidationError('Hasil pekerjaan wajib diisi.');
      return;
    }

    setValidationError(null);

    const newReport: LaporanKerjaHarianItem = {
      id: `LPR-${Date.now()}`,
      noLaporan,
      tanggal,
      waktu,
      areaId: selectedAreaObj.id,
      areaNama: selectedAreaObj.namaArea,
      clientId: selectedClientObj.id,
      clientNama: selectedClientObj.namaPerusahaan,
      namaPelapor,
      jabatanPelapor,
      jenisPekerjaan,
      lokasiObjek,
      uraianPekerjaan,
      hasilPekerjaan,
      kendala: kendala || undefined,
      tindakLanjut: tindakLanjut || undefined,
      fotoBeforeUrl: fotoBefore || undefined,
      fotoProgressUrl: fotoProgress || undefined,
      fotoAfterUrl: fotoAfter || undefined,
      statusPemeriksaan: 'menunggu_verifikasi',
    };

    const currentReports = StorageService.getLaporanHarian();
    currentReports.unshift(newReport);
    StorageService.saveLaporanHarian(currentReports);

    // Audit log
    StorageService.logActivity(
      currentUser,
      'INPUT_LAPORAN_HARIAN',
      'Laporan Kerja Harian',
      `Membuat laporan harian ${noLaporan} untuk area ${selectedAreaObj.namaArea}`
    );

    setIsSavedSuccess(true);
  };

  const handleReset = () => {
    setUraianPekerjaan('');
    setHasilPekerjaan('');
    setKendala('');
    setTindakLanjut('');
    setFotoBefore('');
    setFotoProgress('');
    setFotoAfter('');
    setIsSavedSuccess(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span>Form Input Laporan Kerja Harian Bergambar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dokumentasi pekerjaan cleaning service harian lengkap dengan foto Before, Progress, dan After
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-md border border-slate-200">
          {noLaporan}
        </span>
      </div>

      {isSavedSuccess ? (
        <div className="bg-white p-8 rounded-xl border border-emerald-200 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Laporan Harian Berhasil Dikirim!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Nomor dokumen <strong>{noLaporan}</strong> telah tersimpan dan diteruskan ke Supervisor untuk verifikasi mutu pekerjaan.
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              + Input Laporan Lainnya
            </button>
            {onSuccessNavigate && (
              <button
                onClick={() => onSuccessNavigate('laporan_harian')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Lihat Rekap Laporan
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pengerjaan:</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Waktu / Jam (WIB):</label>
              <input
                type="time"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Area Penugasan Site:</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                disabled={currentUser.areaId !== 'ALL'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 cursor-pointer"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.namaArea} — ({a.clientNama})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pelapor / PIC:</label>
              <input
                type="text"
                value={namaPelapor}
                onChange={(e) => setNamaPelapor(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan Pelapor:</label>
              <input
                type="text"
                value={jabatanPelapor}
                onChange={(e) => setJabatanPelapor(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Jenis Pekerjaan:</label>
              <select
                value={jenisPekerjaan}
                onChange={(e) => setJenisPekerjaan(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Floor Buffing & Crystallization">Floor Buffing & Crystallization</option>
                <option value="Washroom Deep Sanitation">Washroom Deep Sanitation</option>
                <option value="Glass & Facade Cleaning">Glass & Facade Cleaning</option>
                <option value="Carpet Shampooing & Extraction">Carpet Shampooing & Extraction</option>
                <option value="High Level Dusting">High Level Dusting</option>
                <option value="Waste Management & TPS">Waste Management & TPS</option>
                <option value="Disinfeksi & Sanitasi Ruangan">Disinfeksi & Sanitasi Ruangan</option>
                <option value="General Cleaning Rutin">General Cleaning Rutin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi / Objek Spesifik:</label>
              <input
                type="text"
                value={lokasiObjek}
                onChange={(e) => setLokasiObjek(e.target.value)}
                placeholder="Contoh: Toilet Lantai 5 Tower A"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Work Description Section */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Uraian Pekerjaan yang Dilakukan:
              </label>
              <textarea
                rows={3}
                value={uraianPekerjaan}
                onChange={(e) => setUraianPekerjaan(e.target.value)}
                placeholder="Tuliskan langkah kerja, mesin/alat yang dipakai, dan chemical yang diaplikasikan..."
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hasil Pekerjaan (Output / Mutu Kualitas):
              </label>
              <textarea
                rows={2}
                value={hasilPekerjaan}
                onChange={(e) => setHasilPekerjaan(e.target.value)}
                placeholder="Contoh: Marmer mengkilap tanpa guratan, toilet steril harum pine, wastafel bebas kerak kalsium..."
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kendala Lapangan (Jika Ada):</label>
                <input
                  type="text"
                  value={kendala}
                  onChange={(e) => setKendala(e.target.value)}
                  placeholder="Contoh: Pipa pembuangan mampet, lalu lintas pengunjung padat"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tindak Lanjut / Solusi:</label>
                <input
                  type="text"
                  value={tindakLanjut}
                  onChange={(e) => setTindakLanjut(e.target.value)}
                  placeholder="Contoh: Barikade dipasang, dilaporkan ke Engineering BM"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Documentation Section (Before, Progress, After) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Dokumentasi Foto Pekerjaan (Sebelum, Progress & Sesudah)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Wajib menyertakan bukti visual pekerjaan untuk verifikasi standar kebersihan SOP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slot 1: Foto BEFORE */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200">
                    Foto 1: BEFORE (Kondisi Awal)
                  </span>
                  {fotoBefore ? (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-300 h-36">
                      <img src={fotoBefore} alt="Before" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoBefore('')}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 text-[10px]"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleOpenPhotoModal('before')}
                      className="mt-2 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all text-slate-400"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600">Unggah Foto Before</span>
                      <span className="text-[9px] text-slate-400">Kamera / Galeri</span>
                    </div>
                  )}
                </div>
                {fotoBefore && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal('before')}
                    className="mt-2 text-[11px] text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                )}
              </div>

              {/* Slot 2: Foto PROGRESS */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                    Foto 2: PROGRESS (Proses Pengerjaan)
                  </span>
                  {fotoProgress ? (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-300 h-36">
                      <img src={fotoProgress} alt="Progress" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoProgress('')}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 text-[10px]"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleOpenPhotoModal('progress')}
                      className="mt-2 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all text-slate-400"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600">Unggah Foto Progress</span>
                      <span className="text-[9px] text-slate-400">Opsional</span>
                    </div>
                  )}
                </div>
                {fotoProgress && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal('progress')}
                    className="mt-2 text-[11px] text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                )}
              </div>

              {/* Slot 3: Foto AFTER */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                    Foto 3: AFTER (Hasil Akhir Bersih)
                  </span>
                  {fotoAfter ? (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-300 h-36">
                      <img src={fotoAfter} alt="After" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoAfter('')}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 text-[10px]"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleOpenPhotoModal('after')}
                      className="mt-2 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all text-slate-400"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600">Unggah Foto After</span>
                      <span className="text-[9px] text-slate-400">Bukti Hasil Standar SOP</span>
                    </div>
                  )}
                </div>
                {fotoAfter && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal('after')}
                    className="mt-2 text-[11px] text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Bersihkan Form</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Kirim Laporan</span>
            </button>
          </div>
        </form>
      )}

      {/* Photo Capture Modal */}
      <ImageUploadModal
        isOpen={modalUploadOpen}
        onClose={() => setModalUploadOpen(false)}
        title={`Lampirkan Foto ${activePhotoSlot.toUpperCase()}`}
        defaultType={activePhotoSlot}
        onImageSelected={handlePhotoCaptured}
      />
    </div>
  );
};
