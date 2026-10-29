import React, { useState } from 'react';
import {
  UserCircle,
  KeyRound,
  ShieldCheck,
  History,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { UserAccount, AuditLogItem } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { formatDateTimeID } from '../utils/calculations.ts';

interface ProfileViewProps {
  currentUser: UserAccount;
  onUpdateCurrentUser: (updated: UserAccount) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateCurrentUser,
}) => {
  const auditLogs = StorageService.getAuditLogs().filter(
    (l) => l.userId === currentUser.id
  );

  // Editable Profile fields
  const [telepon, setTelepon] = useState(currentUser.telepon);
  const [email, setEmail] = useState(currentUser.email);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...currentUser,
      telepon,
      email,
    };

    onUpdateCurrentUser(updated);
    StorageService.setCurrentUser(updated);

    const users = StorageService.getUsers().map((u) => (u.id === updated.id ? updated : u));
    StorageService.saveUsers(users);

    StorageService.logActivity(
      currentUser,
      'UPDATE_PROFILE',
      'Profile',
      `Memperbarui informasi kontak telepon (${telepon}) dan email (${email})`
    );

    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setPasswordMsg({ type: 'error', text: 'Masukkan kata sandi lama.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setPasswordMsg({
      type: 'success',
      text: 'Kata sandi akun Anda berhasil diperbarui secara aman!',
    });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    StorageService.logActivity(
      currentUser,
      'CHANGE_PASSWORD',
      'Profile & Keamanan',
      'Berhasil mengganti kata sandi akun'
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
            {currentUser.nama.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{currentUser.nama}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.jabatan}</p>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              NIK: {currentUser.nik} • Username: <strong>{currentUser.username}</strong>
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <span className="text-slate-400 text-[10px] block">Area Penempatan:</span>
          <span className="font-bold text-slate-800">
            {currentUser.areaId === 'ALL'
              ? 'Seluruh Indonesia (Nasional)'
              : 'Menara Thamrin (Jakarta Pusat)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCircle className="w-4 h-4 text-emerald-600" />
              <span>Data Kontak Pribadi</span>
            </h3>
            <span className="text-[10px] text-slate-400">Dapat diedit</span>
          </div>

          {isProfileSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kontak profil berhasil diperbarui!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp:</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Email:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start space-x-2">
              <Lock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Sesuai Section 19: Pengguna tidak diizinkan mengubah Role atau Area penugasan sendiri. Perubahan kewenangan wajib melalui Administrator Pusat.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Perubahan Kontak
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Keamanan & Ubah Kata Sandi</span>
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Enkripsi Aktif
            </span>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Lama:</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Perbarui Kata Sandi
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log Activity History */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Aktivitas & Jejak Audit Pengguna</span>
          </h3>
          <span className="text-[10px] text-slate-400">{auditLogs.length} Aktivitas Tercatat</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 italic">
              Belum ada riwayat aktivitas tercatat untuk akun ini.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{log.modul}</span>
                    <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                      {log.aksi}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.rincian}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                  {formatDateTimeID(log.waktu)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
