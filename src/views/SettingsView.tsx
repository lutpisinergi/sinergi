import React, { useState } from 'react';
import {
  Settings,
  Image,
  Upload,
  Mail,
  ShieldAlert,
  Server,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Building2,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react';
import { UserAccount, AppSettings } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { ArchitectureMigrationModal } from '../components/modals/ArchitectureMigrationModal.tsx';

interface SettingsViewProps {
  currentUser: UserAccount;
  onRefreshAppSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onRefreshAppSettings,
}) => {
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  // SLA Inputs
  const [slaDarurat, setSlaDarurat] = useState(settings.slaComplainJamDefault.darurat);
  const [slaTinggi, setSlaTinggi] = useState(settings.slaComplainJamDefault.tinggi);
  const [slaSedang, setSlaSedang] = useState(settings.slaComplainJamDefault.sedang);
  const [slaRendah, setSlaRendah] = useState(settings.slaComplainJamDefault.rendah);

  // Email inputs
  const [smtpHost, setSmtpHost] = useState(settings.smtpConfig.host);
  const [smtpPort, setSmtpPort] = useState(settings.smtpConfig.port);
  const [emailSender, setEmailSender] = useState(settings.emailPengirimNotifikasi);

  // Logo preset simulation
  const [customLogoUrl, setCustomLogoUrl] = useState(settings.logoUrl);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      logoUrl: customLogoUrl,
      emailPengirimNotifikasi: emailSender,
      slaComplainJamDefault: {
        darurat: slaDarurat,
        tinggi: slaTinggi,
        sedang: slaSedang,
        rendah: slaRendah,
      },
      smtpConfig: {
        ...settings.smtpConfig,
        host: smtpHost,
        port: smtpPort,
      },
    };

    StorageService.saveSettings(updated);
    setSettings(updated);
    onRefreshAppSettings();

    StorageService.logActivity(
      currentUser,
      'UPDATE_SETTINGS',
      'Pengaturan Sistem',
      'Memperbarui konfigurasi SLA komplain dan pengaturan email gateway'
    );

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetFactory = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data demo kembali ke data awal pabrik? Semua transaksi baru akan dibersihkan.')) {
      StorageService.resetToFactorySeed();
      alert('Data sistem berhasil direset ke konfigurasi awal! Halaman akan dimuat ulang.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Pengaturan Sistem & Branding Perusahaan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi identitas PT. SINERGI Integra Services, batas SLA penanganan komplain, dan gateway email
          </p>
        </div>

        <button
          onClick={() => setIsMigrationModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-lg border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
        >
          <Server className="w-4 h-4 text-indigo-600" />
          <span>Kajian Skalabilitas & Migrasi DB</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">Konfigurasi pengaturan operasional berhasil disimpan ke database!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Section 1: Logo & Branding PT. SINERGI (Section 20 Requirement) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Image className="w-4 h-4 text-emerald-600" />
              <span>Logo Resmi PT. SINERGI Integra Services (Section 20)</span>
            </h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded">
              Warna Korporat Emerald #059669
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-24 h-24 rounded-xl border border-slate-200 p-2 bg-slate-50 flex items-center justify-center shrink-0">
              <div className="w-20 h-20 rounded-lg bg-emerald-600 flex flex-col items-center justify-center text-white font-extrabold shadow-sm text-center">
                <span className="text-2xl leading-none">SIS</span>
                <span className="text-[7px] uppercase tracking-widest mt-1">Sinergi</span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <p className="font-bold text-slate-800">Unggah Logo Resmi Baru Perusahaan:</p>
              <p className="text-slate-500 text-[11px]">
                Format didukung: PNG transparan, SVG, atau JPG resolusi tinggi. Palet warna primer antarmuka diselaraskan otomatis dengan identitas corporate hijau zamrud / emerald PT. SINERGI Integra Services.
              </p>
              <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer transition-colors border border-slate-300">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Pilih File Logo dari Perangkat</span>
                <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: General System Identifiers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Parameter Regional & Konvensi Format (Section 1)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan:</label>
              <input
                type="text"
                value={settings.namaPerusahaan}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Zona Waktu Operasional:</label>
              <input
                type="text"
                value={settings.zonaWaktu}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Format Tanggal:</label>
              <input
                type="text"
                value={settings.formatTanggal}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mata Uang:</label>
              <input
                type="text"
                value={settings.mataUang}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: SLA Complain Target Configuration (Section 14) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Target Waktu Service Level Agreement (SLA) Komplain</span>
            </h3>
            <span className="text-[10px] text-slate-400">Satuan: Jam Kerja</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <label className="block font-bold text-red-900">Darurat (Emergency):</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={slaDarurat}
                  onChange={(e) => setSlaDarurat(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg bg-white font-bold text-red-800"
                />
                <span className="text-slate-500 font-medium">Jam</span>
              </div>
              <span className="text-[10px] text-red-700">Genangan air licin, bau gas</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <label className="block font-bold text-rose-900">Prioritas Tinggi:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={slaTinggi}
                  onChange={(e) => setSlaTinggi(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-rose-300 rounded-lg bg-white font-bold text-rose-800"
                />
                <span className="text-slate-500 font-medium">Jam</span>
              </div>
              <span className="text-[10px] text-rose-700">Toilet VIP, ruang direksi</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <label className="block font-bold text-amber-900">Prioritas Sedang:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={slaSedang}
                  onChange={(e) => setSlaSedang(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white font-bold text-amber-800"
                />
                <span className="text-slate-500 font-medium">Jam</span>
              </div>
              <span className="text-[10px] text-amber-700">Noda karpet, tempat sampah</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <label className="block font-bold text-slate-800">Prioritas Rendah:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={slaRendah}
                  onChange={(e) => setSlaRendah(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                />
                <span className="text-slate-500 font-medium">Jam</span>
              </div>
              <span className="text-[10px] text-slate-500">Debu kaca luar, sarang laba</span>
            </div>
          </div>
        </div>

        {/* Section 4: Email SMTP Configuration (Section 18) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi Pengiriman Email Laporan (SMTP Gmail / Workspace)</span>
            </h3>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Status: Terhubung (SSL/TLS)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Email Pengirim Resmi:</label>
              <input
                type="email"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SMTP Host Server:</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SMTP Port:</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetFactory}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Data Demo Awal (Factory Reset)</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Simpan Semua Pengaturan
          </button>
        </div>
      </form>

      {/* Migration Modal */}
      <ArchitectureMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />
    </div>
  );
};
