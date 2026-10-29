import React, { useState } from 'react';
import { Mail, Send, X, Paperclip, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorageService } from '../../services/storage.ts';

interface EmailSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultCc?: string;
  defaultSubject?: string;
  defaultBody?: string;
  attachmentName?: string;
  areaNama?: string;
}

export const EmailSenderModal: React.FC<EmailSenderModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient = 'client.pic@menarathamrin.co.id',
  defaultCc = 'hendra.wijaya@sinergi-services.co.id, denny.pratama@sinergi-services.co.id',
  defaultSubject = 'Laporan Realisasi Pekerjaan Cleaning Service – Menara Thamrin – Periode Oktober 2026',
  defaultBody,
  attachmentName = 'Laporan_Operasional_A4_Oktober_2026.pdf',
  areaNama = 'Menara Thamrin',
}) => {
  if (!isOpen) return null;

  const [to, setTo] = useState(defaultRecipient);
  const [cc, setCc] = useState(defaultCc);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(
    defaultBody ||
      `Yth. Bapak/Ibu,\n\nBersama email ini kami sampaikan laporan realisasi pekerjaan cleaning service untuk area ${areaNama} periode Oktober 2026.\n\nLaporan terlampir mencakup rencana pekerjaan, realisasi, serta catatan operasional yang relevan.\n\nMohon dapat ditinjau. Apabila terdapat pertanyaan atau tindak lanjut yang diperlukan, silakan menghubungi tim operasional kami.\n\nTerima kasih atas perhatian dan kerja samanya.\n\nHormat kami,\nPT. SINERGI Integra Services\nDivisi Operasional`
  );

  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      const currentUser = StorageService.getCurrentUser();
      StorageService.logActivity(
        currentUser,
        'SEND_EMAIL_REPORT',
        'Email Dispatcer',
        `Mengirim email laporan [${subject}] kepada ${to}`
      );
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kirim Laporan Melalui Email Resmi</h3>
              <p className="text-xs text-slate-400">Pengiriman laporan operasional ke Client & Manajemen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Email Berhasil Dikirim!</h4>
              <p className="text-xs text-slate-500">
                Laporan dan lampiran PDF telah terkirim ke <strong>{to}</strong> dengan status pengiriman Sukses.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kepada (Penerima):</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="email.client@perusahaan.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tembusan (CC):</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="email1@sinergi-services.co.id, email2@sinergi-services.co.id"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subjek Email:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Pesan:</label>
                <textarea
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Attachment Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{attachmentName}</p>
                    <p className="text-[10px] text-slate-500">PDF A4 • 142 KB • Terlampir Otomatis</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Terverifikasi
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Menggunakan server SMTP resmi PT. SINERGI Integra Services</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'Mengirim...' : 'Kirim Email Sekarang'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
