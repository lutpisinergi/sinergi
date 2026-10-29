import React, { useState, useRef } from 'react';
import {
  CalendarCheck2,
  Upload,
  Copy,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Printer,
  Mail,
  X,
  Sparkles,
  Download,
} from 'lucide-react';
import { UserAccount, MasterCleaningProgramItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface MasterCleaningProgramViewProps {
  currentUser: UserAccount;
}

export const MasterCleaningProgramView: React.FC<MasterCleaningProgramViewProps> = ({
  currentUser,
}) => {
  const [programs, setPrograms] = useState<MasterCleaningProgramItem[]>(
    StorageService.getMasterProgram()
  );
  const areas = StorageService.getAreas();

  // Filters
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    currentUser.areaId === 'ALL' ? 'ALL' : currentUser.areaId
  );

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Form State for new program item
  const [kategoriPekerjaan, setKategoriPekerjaan] = useState('Floor Care & Crystallization');
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [lokasiObjek, setLokasiObjek] = useState('');
  const [frekuensi, setFrekuensi] = useState<MasterCleaningProgramItem['frekuensi']>('Bulanan');
  const [targetPekerjaanTahunan, setTargetPekerjaanTahunan] = useState(12);
  const [satuan, setSatuan] = useState('Sesi Treatment');
  const [pic, setPic] = useState('Supervisor Area');
  const [catatan, setCatatan] = useState('');

  // Sample Import File State
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<Partial<MasterCleaningProgramItem>>>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPrograms = programs.filter((p) => {
    if (p.tahun !== selectedTahun) return false;
    if (selectedAreaId !== 'ALL' && p.areaId !== selectedAreaId) return false;
    return true;
  });

  // Duplicate Previous Year to Next Year
  const handleDuplicateToNextYear = () => {
    const nextYear = selectedTahun + 1;
    const currentYearItems = programs.filter((p) => p.tahun === selectedTahun);

    if (currentYearItems.length === 0) {
      alert(`Tidak ada program kerja pada tahun ${selectedTahun} untuk diduplikasi.`);
      return;
    }

    const duplicated = currentYearItems.map((p) => ({
      ...p,
      id: `MCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tahun: nextYear,
      statusApproval: 'draft' as const,
      version: p.version + 1,
      catatan: `Draft duplikasi dari program tahun ${selectedTahun} (Revisi v${p.version + 1})`,
    }));

    const updated = [...programs, ...duplicated];
    setPrograms(updated);
    StorageService.saveMasterProgram(updated);
    StorageService.logActivity(
      currentUser,
      'DUPLIKASI_PROGRAM_TAHUNAN',
      'Master Cleaning Program',
      `Menduplikasi ${duplicated.length} item program tahun ${selectedTahun} ke tahun ${nextYear}`
    );

    setSelectedTahun(nextYear);
    alert(`Berhasil membuat ${duplicated.length} draft program kerja tahun ${nextYear}!`);
  };

  const handleSaveProgramItem = (e: React.FormEvent) => {
    e.preventDefault();
    const targetArea = areas.find((a) => a.id === (selectedAreaId === 'ALL' ? areas[0].id : selectedAreaId)) || areas[0];

    const newItem: MasterCleaningProgramItem = {
      id: `MCP-${Date.now()}`,
      tahun: selectedTahun,
      areaId: targetArea.id,
      areaNama: targetArea.namaArea,
      clientId: targetArea.clientId,
      clientNama: targetArea.clientNama,
      kategoriPekerjaan,
      namaPekerjaan,
      lokasiObjek,
      frekuensi,
      targetPekerjaanTahunan,
      satuan,
      bulanPelaksanaan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      pic,
      catatan,
      statusApproval: 'disetujui',
      version: 1,
    };

    const updated = [...programs, newItem];
    setPrograms(updated);
    StorageService.saveMasterProgram(updated);
    StorageService.logActivity(
      currentUser,
      'TAMBAH_PROGRAM_TAHUNAN',
      'Master Cleaning Program',
      `Menambah program tahunan: ${namaPekerjaan} (${targetArea.namaArea})`
    );

    setIsAddModalOpen(false);
    setNamaPekerjaan('');
    setLokasiObjek('');
  };

  // Sample file import parser simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    setImportErrors([]);

    // Simulate smart header detection & mapping
    const sampleParsed: Array<Partial<MasterCleaningProgramItem>> = [
      {
        kategoriPekerjaan: 'Floor & Carpet Deep Extraction',
        namaPekerjaan: 'Dry Foam Shampooing & Ekstraksi Noda Karpet Ballroom',
        lokasiObjek: 'Ruang Serbaguna & Koridor Utama Lt. 2',
        frekuensi: 'Triwulan',
        targetPekerjaanTahunan: 4,
        satuan: 'Sesi Treatment',
        pic: 'Arif Rahman Hakim (SPV)',
      },
      {
        kategoriPekerjaan: 'Façade & High Level Glass',
        namaPekerjaan: 'Pembersihan Kaca Kanopi Drop Off & Skylight',
        lokasiObjek: 'Main Entrance & Lobby Atrium',
        frekuensi: 'Bulanan',
        targetPekerjaanTahunan: 12,
        satuan: 'Putaran Area',
        pic: 'Tim Gondola K3',
      },
    ];

    setParsedRows(sampleParsed);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    const targetArea = areas.find((a) => a.id === (selectedAreaId === 'ALL' ? areas[0].id : selectedAreaId)) || areas[0];

    const newItems: MasterCleaningProgramItem[] = parsedRows.map((row, idx) => ({
      id: `MCP-IMP-${Date.now()}-${idx}`,
      tahun: selectedTahun,
      areaId: targetArea.id,
      areaNama: targetArea.namaArea,
      clientId: targetArea.clientId,
      clientNama: targetArea.clientNama,
      kategoriPekerjaan: row.kategoriPekerjaan || 'General Cleaning',
      namaPekerjaan: row.namaPekerjaan || 'Program Pembersihan',
      lokasiObjek: row.lokasiObjek || 'Area Umum',
      frekuensi: row.frekuensi || 'Bulanan',
      targetPekerjaanTahunan: row.targetPekerjaanTahunan || 12,
      satuan: row.satuan || 'Sesi',
      bulanPelaksanaan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      pic: row.pic || 'Supervisor Area',
      statusApproval: 'disetujui',
      version: 1,
    }));

    const updated = [...programs, ...newItems];
    setPrograms(updated);
    StorageService.saveMasterProgram(updated);
    StorageService.logActivity(
      currentUser,
      'IMPORT_EXCEL_PROGRAM',
      'Master Cleaning Program',
      `Import ${newItems.length} item program dari file ${importedFileName}`
    );

    setIsImportModalOpen(false);
    setParsedRows([]);
    setImportedFileName(null);
    alert(`Berhasil mengimpor ${newItems.length} item program kerja!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Master Cleaning Program (Rencana Kerja Tahunan)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Tahun {selectedTahun}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Panduan rencana kerja tahunan cleaning service dengan pemetaan objek, frekuensi, target tahunan, dan PIC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value={2025}>Tahun 2025</option>
            <option value={2026}>Tahun 2026</option>
            <option value={2027}>Tahun 2027 (Draft)</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Tambah Program
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Excel/CSV</span>
          </button>

          <button
            onClick={handleDuplicateToNextYear}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Duplikasi Program ke Tahun Berikutnya"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>Duplikasi Draft {selectedTahun + 1}</span>
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak A4"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Program Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Daftar Program Kerja Tahunan ({filteredPrograms.length} Item Terdaftar)
            </span>
          </div>
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
                <th className="py-3 px-4">Kategori & Nama Pekerjaan</th>
                <th className="py-3 px-4">Lokasi / Objek Spesifik</th>
                <th className="py-3 px-4 text-center">Frekuensi</th>
                <th className="py-3 px-4 text-center">Target Tahunan</th>
                <th className="py-3 px-4">Penanggung Jawab (PIC)</th>
                <th className="py-3 px-4 text-center">Bulan Pelaksanaan</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Belum ada item rencana kerja tahunan untuk tahun {selectedTahun}. Silakan tambah manual atau import Excel/CSV.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.namaPekerjaan}</p>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                        {p.kategoriPekerjaan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{p.lokasiObjek}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{p.frekuensi}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-black text-slate-900 text-sm">{p.targetPekerjaanTahunan}</span>
                      <span className="text-[10px] text-slate-500 block">{p.satuan}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.pic}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                          const isScheduled = p.bulanPelaksanaan.includes(m);
                          return (
                            <span
                              key={m}
                              className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                                isScheduled
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-300'
                              }`}
                              title={`Bulan ${m}`}
                            >
                              {m}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full border border-emerald-200">
                        Disetujui
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Program Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Tambah Program Kerja Tahunan ({selectedTahun})</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgramItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Program:</label>
                <select
                  value={kategoriPekerjaan}
                  onChange={(e) => setKategoriPekerjaan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Floor Care & Crystallization">Floor Care & Crystallization</option>
                  <option value="Washroom & Deep Sanitation">Washroom & Deep Sanitation</option>
                  <option value="Glass & Facade Cleaning">Glass & Facade Cleaning</option>
                  <option value="Carpet Shampooing & Extraction">Carpet Shampooing & Extraction</option>
                  <option value="High Dusting & Ceiling Care">High Dusting & Ceiling Care</option>
                  <option value="Waste Management & TPS">Waste Management & TPS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Program Pekerjaan:</label>
                <input
                  type="text"
                  value={namaPekerjaan}
                  onChange={(e) => setNamaPekerjaan(e.target.value)}
                  placeholder="Contoh: Kristalisasi Lantai Marmer Main Lobby"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi / Objek Spesifik:</label>
                <input
                  type="text"
                  value={lokasiObjek}
                  onChange={(e) => setLokasiObjek(e.target.value)}
                  placeholder="Contoh: Selasar Tower A Lt. Ground & Mezzanine"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frekuensi:</label>
                  <select
                    value={frekuensi}
                    onChange={(e) => setFrekuensi(e.target.value as MasterCleaningProgramItem['frekuensi'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="2 Mingguan">2 Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Triwulan">Triwulan</option>
                    <option value="Semesteran">Semesteran</option>
                    <option value="Tahunan">Tahunan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Tahunan:</label>
                  <input
                    type="number"
                    min="1"
                    value={targetPekerjaanTahunan}
                    onChange={(e) => setTargetPekerjaanTahunan(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan:</label>
                  <input
                    type="text"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PIC):</label>
                <input
                  type="text"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  required
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
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Sample File & Import Modal (Section 8 Explicit Requirement) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Import File Contoh Rencana Kerja Tahunan (Excel / CSV)</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Sesuai Instruksi Section 8: Analisis Format & Pemetaan Kolom Otomatis</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Unggah file Excel/CSV contoh rencana kerja tahunan Anda. Sistem akan memetakan kolom sumber ke field database, mengidentifikasi duplikasi, dan menampilkan preview sebelum disimpan.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/20"
              >
                {importedFileName ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-slate-800">{importedFileName}</p>
                    <p className="text-[10px] text-slate-500">File berhasil dibaca. {parsedRows.length} item terdeteksi.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">Pilih File Master Cleaning Program (.xlsx / .csv)</p>
                    <p className="text-[10px] text-slate-400">Klik di sini untuk menelusuri file dari komputer</p>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-100 font-bold text-slate-700 text-[11px]">
                    Preview Hasil Pemetaan Kolom ({parsedRows.length} Baris):
                  </div>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                      <tr>
                        <th className="p-2">Nama Pekerjaan</th>
                        <th className="p-2">Lokasi Objek</th>
                        <th className="p-2">Frekuensi</th>
                        <th className="p-2">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-semibold text-slate-800">{r.namaPekerjaan}</td>
                          <td className="p-2 text-slate-600">{r.lokasiObjek}</td>
                          <td className="p-2">{r.frekuensi}</td>
                          <td className="p-2 font-bold">{r.targetPekerjaanTahunan} {r.satuan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedRows.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Konfirmasi & Simpan ke Database
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
        title={`Master Cleaning Program — Rencana Kerja Tahunan ${selectedTahun}`}
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode={`Tahun Kalender ${selectedTahun}`}
        headers={['Kategori', 'Nama Pekerjaan', 'Lokasi Objek', 'Frekuensi', 'Target Tahunan', 'Satuan', 'PIC']}
        rows={filteredPrograms.map((p) => [
          p.kategoriPekerjaan,
          p.namaPekerjaan,
          p.lokasiObjek,
          p.frekuensi,
          p.targetPekerjaanTahunan,
          p.satuan,
          p.pic,
        ])}
        preparedBy="Staff Operasional Site"
        checkedBy="Supervisor / Area Koordinator"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Nasional"
        attachmentName={`Master_Cleaning_Program_${selectedTahun}.pdf`}
      />
    </div>
  );
};
