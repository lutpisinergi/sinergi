import React from 'react';
import { Database, Server, ShieldCheck, AlertTriangle, ArrowRight, Zap, CheckCircle2, X } from 'lucide-react';

interface ArchitectureMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureMigrationModal: React.FC<ArchitectureMigrationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Analisis Keterbatasan Stack Awal & Rekomendasi Migrasi Skalabilitas
              </h3>
              <p className="text-xs text-slate-400">
                Kajian Teknis PT. SINERGI Integra Services untuk Menopang Target Ribuan Akun Pengguna
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-xs">Peringatan Teknis Skalabilitas (Section 3)</h4>
              <p className="text-amber-800 mt-1">
                Google Sheets dan Google Apps Script (GAS) sangat ideal untuk <strong>fase prototipe & uji coba awal</strong> (di bawah 50 concurrent users). Namun, untuk target bisnis perusahaan dengan <strong>ribuan akun pengguna aktif</strong> di seluruh Indonesia, Google Sheets memiliki pembatasan konkurensi (row-lock), kuota eksekusi 6 menit per trigger, serta limit kuota baca/tulis Google API.
              </p>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Matriks Komparasi Teknis & Kapasitas Beban</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Parameter Evaluasi</th>
                    <th className="p-3 bg-amber-50/50 text-amber-900">Stack Awal (GAS + Google Sheets)</th>
                    <th className="p-3 bg-emerald-50/50 text-emerald-900">Stack Produksi (Cloud SQL PostgreSQL + Node.js)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Kapasitas Pengguna Bersamaan</td>
                    <td className="p-3 text-rose-700">Terbatas (~30-50 concurrent users sebelum lock timeout)</td>
                    <td className="p-3 text-emerald-700 font-semibold">Tinggi (10.000+ concurrent users dengan connection pooling)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Waktu Eksekusi Maksimal</td>
                    <td className="p-3 text-rose-700">Maksimal 6 menit per script run (gagal jika rekap besar)</td>
                    <td className="p-3 text-emerald-700">Fleksibel (Background worker & message queues)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Integritas Transaksi (ACID)</td>
                    <td className="p-3 text-amber-700">Rentan race condition pada transaksi stok inventory serentak</td>
                    <td className="p-3 text-emerald-700 font-semibold">ACID compliant penuh (Row Locking, Foreign Keys, Indexing)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Penyimpanan Foto & Dokumen</td>
                    <td className="p-3">Google Drive API (terikat kuota request harian)</td>
                    <td className="p-3 text-emerald-700">Google Cloud Storage Bucket (CDN edge, cepat & tak terbatas)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Biaya Infrastruktur (TCO)</td>
                    <td className="p-3 text-emerald-700 font-bold">Gratis s/d Sangat Murah (Google Workspace add-on)</td>
                    <td className="p-3 text-slate-800">Rp 450.000 – Rp 1.500.000 / bulan (skala fleksibel)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Migration Roadmap */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Rencana Tahapan Migrasi Berjenjang (Roadmap)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Fase 1: Uji Lapangan (1-2 Bulan)</span>
                <p className="font-bold text-slate-800 mt-1">Pilot 3-5 Site Utama</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Validasi proses bisnis cleaning service, form harian, SOP komplain SLA, dan pelatihan supervisor.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Fase 2: Load Testing & ETL (Bulan 3)</span>
                <p className="font-bold text-slate-800 mt-1">Uji Beban 500+ Pengguna</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Jalankan stress testing simulasi absensi serentak pagi jam 06:00 WIB dan upload foto before-after.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Fase 3: Migrasi Produksi Penuh</span>
                <p className="font-bold text-slate-800 mt-1">Cloud SQL Relasional</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Pindahkan data master dan transaksi ke PostgreSQL dengan zero downtime dan enkripsi AES-256.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Saya Memahami Kajian Arsitektur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
