import React, { useState } from 'react';
import {
  MessageSquareWarning,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Flame,
  Search,
  Filter,
  Camera,
  Star,
  Printer,
  Mail,
  User,
  X,
  Send,
  Building,
} from 'lucide-react';
import {
  UserAccount,
  HandlingComplainItem,
  StatusComplain,
  PrioritasComplain,
} from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import {
  calculateComplainSLA,
  formatDateID,
  formatDateTimeID,
} from '../utils/calculations.ts';
import { ImageUploadModal } from '../components/modals/ImageUploadModal.tsx';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface ComplainHandlingViewProps {
  currentUser: UserAccount;
}

export const ComplainHandlingView: React.FC<ComplainHandlingViewProps> = ({ currentUser }) => {
  const [complains, setComplains] = useState<HandlingComplainItem[]>(
    StorageService.getComplains()
  );
  const areas = StorageService.getAreas();
  const clients = StorageService.getClients();

  // Selected Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<HandlingComplainItem | null>(null);

  // New Complaint Modal
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoTarget, setPhotoTarget] = useState<'complain' | 'after'>('complain');

  // New Ticket Form State
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState('Kebersihan Toilet & Perlengkapan');
  const [formPrioritas, setFormPrioritas] = useState<PrioritasComplain>('Tinggi');
  const [formUraian, setFormUraian] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formAreaId, setFormAreaId] = useState(areas[0]?.id || '');

  // Action / Follow Up State
  const [actionAnalisis, setActionAnalisis] = useState('');
  const [actionPerbaikan, setActionPerbaikan] = useState('');
  const [actionFotoAfter, setActionFotoAfter] = useState('');
  const [actionPicNama, setActionPicNama] = useState(currentUser.nama);
  const [actionRating, setActionRating] = useState<number>(5);
  const [actionCatatanClient, setActionCatatanClient] = useState('');

  // Print & Email
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isClient = currentUser.role === 'client';
  const isSupervisorOrAbove =
    currentUser.role === 'spv' ||
    currentUser.role === 'area_coord' ||
    currentUser.role === 'om' ||
    currentUser.role === 'direktur' ||
    currentUser.role === 'admin_ops';

  // Scoped dataset
  const filteredComplains = complains.filter((c) => {
    if (isClient && currentUser.clientId && c.clientId !== currentUser.clientId) {
      return false;
    }
    if (currentUser.areaId !== 'ALL' && !isClient && c.areaId !== currentUser.areaId) {
      return false;
    }
    if (statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.noTiket.toLowerCase().includes(q) ||
        c.judul.toLowerCase().includes(q) ||
        c.kategori.toLowerCase().includes(q) ||
        c.namaPelapor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate default SLA hours by priority
  const getSlaHours = (p: PrioritasComplain): number => {
    switch (p) {
      case 'Darurat':
        return 1;
      case 'Tinggi':
        return 4;
      case 'Sedang':
        return 12;
      case 'Rendah':
        return 24;
      default:
        return 12;
    }
  };

  // Submit New Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const area = areas.find((a) => a.id === formAreaId) || areas[0];
    const client = clients.find((c) => c.id === area.clientId) || clients[0];

    const targetResolveHours = getSlaHours(formPrioritas);
    const now = new Date();
    const deadline = new Date(now.getTime() + targetResolveHours * 60 * 60 * 1000).toISOString();

    const noTiket = `TKT/CMP/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 900 + 100))}`;

    const newTicket: HandlingComplainItem = {
      id: `CMP-${Date.now()}`,
      noTiket,
      tanggalMasuk: now.toISOString(),
      clientId: client.id,
      clientNama: client.namaPerusahaan,
      areaId: area.id,
      areaNama: area.namaArea,
      namaPelapor: currentUser.nama,
      kontakPelapor: currentUser.telepon,
      kategori: formKategori,
      prioritas: formPrioritas,
      judul: formJudul,
      uraian: formUraian,
      fotoComplainUrl: formFotoUrl || undefined,
      targetResponseHours: formPrioritas === 'Darurat' ? 0.5 : 1,
      targetResolveHours,
      slaDeadline: deadline,
      status: 'baru',
      riwayatLog: [
        {
          waktu: now.toISOString(),
          oleh: currentUser.nama,
          status: 'baru',
          keterangan: 'Tiket komplain baru didaftarkan ke sistem',
        },
      ],
    };

    const updated = [newTicket, ...complains];
    setComplains(updated);
    StorageService.saveComplains(updated);
    StorageService.logActivity(
      currentUser,
      'CREATE_COMPLAIN',
      'Handling Complain',
      `Tiket baru ${noTiket} - ${formJudul} (Prioritas: ${formPrioritas})`
    );

    setIsNewTicketModalOpen(false);
    setFormJudul('');
    setFormUraian('');
    setFormFotoUrl('');
  };

  // Update Status in Lifecycle
  const handleUpdateStatus = (
    ticketId: string,
    nextStatus: StatusComplain,
    logNotes: string
  ) => {
    const updated = complains.map((t) => {
      if (t.id === ticketId) {
        const isResolving = nextStatus === 'selesai';
        const nowIso = new Date().toISOString();

        return {
          ...t,
          status: nextStatus,
          picPetugasNama: actionPicNama || t.picPetugasNama,
          analisisPenyebab: actionAnalisis || t.analisisPenyebab,
          tindakanPerbaikan: actionPerbaikan || t.tindakanPerbaikan,
          fotoAfterUrl: actionFotoAfter || t.fotoAfterUrl,
          tanggalPenyelesaian: isResolving ? nowIso : t.tanggalPenyelesaian,
          approvalClientTimestamp: isClient && isResolving ? nowIso : t.approvalClientTimestamp,
          ratingKepuasan: isClient && isResolving ? actionRating : t.ratingKepuasan,
          catatanClient: isClient ? actionCatatanClient || t.catatanClient : t.catatanClient,
          riwayatLog: [
            ...t.riwayatLog,
            {
              waktu: nowIso,
              oleh: currentUser.nama,
              status: nextStatus,
              keterangan: logNotes,
            },
          ],
        };
      }
      return t;
    });

    setComplains(updated);
    StorageService.saveComplains(updated);
    StorageService.logActivity(
      currentUser,
      'UPDATE_COMPLAIN_STATUS',
      'Handling Complain',
      `Tiket ${ticketId} status diubah menjadi ${nextStatus}`
    );

    setSelectedTicket(updated.find((t) => t.id === ticketId) || null);
    setActionAnalisis('');
    setActionPerbaikan('');
    setActionFotoAfter('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquareWarning className="w-5 h-5 text-emerald-600" />
              <span>Portal Handling Complain & Monitoring SLA Pelanggan</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
              {filteredComplains.length} Total Tiket
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penanganan keluhan kebersihan dengan target respons & resolusi SLA, verifikasi before-after, serta konfirmasi kepuasan client
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewTicketModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Buat Tiket Komplain
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak Rekap Komplain A4"
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari no tiket, judul komplain, kategori, atau nama pelapor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="dalam_penanganan">Dalam Penanganan</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="menunggu_konfirmasi_client">Menunggu Konfirmasi Client</option>
            <option value="selesai">Selesai (Resolved)</option>
            <option value="dibuka_kembali">Dibuka Kembali (Reopened)</option>
          </select>
        </div>
      </div>

      {/* Complaints Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredComplains.length === 0 ? (
          <div className="md:col-span-2 bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 italic text-xs">
            Tidak ada tiket komplain yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredComplains.map((item) => {
            const sla = calculateComplainSLA(
              item.tanggalMasuk,
              item.targetResolveHours,
              item.tanggalPenyelesaian
            );

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {item.noTiket}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                        {item.judul}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.areaNama} • {formatDateTimeID(item.tanggalMasuk)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          item.prioritas === 'Darurat'
                            ? 'bg-red-600 text-white animate-pulse'
                            : item.prioritas === 'Tinggi'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.prioritas}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sla.badgeClass}`}>
                        {sla.statusText}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {item.uraian}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Pelapor: <strong>{item.namaPelapor}</strong>
                    </span>
                    <span>
                      Kategori: <strong className="text-emerald-700">{item.kategori}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 capitalize">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTicket(item);
                      setActionPicNama(item.picPetugasNama || currentUser.nama);
                      setActionAnalisis(item.analisisPenyebab || '');
                      setActionPerbaikan(item.tindakanPerbaikan || '');
                      setActionFotoAfter(item.fotoAfterUrl || '');
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Buka Detail & Tindak Lanjut →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Detail & Workflow Action Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 text-xs">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="font-mono text-emerald-400 text-xs font-bold">
                  {selectedTicket.noTiket}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedTicket.judul}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* SLA Target Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">SLA Target Resolusi:</span>
                  <p className="font-bold text-slate-800">
                    Maksimal {selectedTicket.targetResolveHours} Jam (Batas Waktu: {formatDateTimeID(selectedTicket.slaDeadline)})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status Siklus:</span>
                  <p className="font-bold text-emerald-800 uppercase">{selectedTicket.status.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pelapor:</span>
                  <p className="font-bold text-slate-800">{selectedTicket.namaPelapor} ({selectedTicket.kontakPelapor})</p>
                </div>
              </div>

              {/* Photos Comparison */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Bukti Foto Komplain vs Foto Penyelesaian
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                    <span className="font-bold text-rose-700 block mb-1">Foto Bukti Komplain (Masuk):</span>
                    {selectedTicket.fotoComplainUrl || selectedTicket.fotoBeforeUrl ? (
                      <img
                        src={selectedTicket.fotoComplainUrl || selectedTicket.fotoBeforeUrl}
                        alt="Foto Komplain"
                        className="w-full h-44 object-cover rounded border border-slate-300"
                      />
                    ) : (
                      <div className="w-full h-44 bg-slate-200/50 rounded flex items-center justify-center text-slate-400">
                        Tidak ada foto
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                    <span className="font-bold text-emerald-700 block mb-1">Foto Bukti Setelah Penanganan (After):</span>
                    {selectedTicket.fotoAfterUrl ? (
                      <img
                        src={selectedTicket.fotoAfterUrl}
                        alt="Foto After"
                        className="w-full h-44 object-cover rounded border border-emerald-400 ring-2 ring-emerald-500/20"
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setPhotoTarget('after');
                          setIsPhotoModalOpen(true);
                        }}
                        className="w-full h-44 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-white"
                      >
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-slate-600 font-semibold">Unggah Foto After Penanganan</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Log History */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Riwayat Audit & Komunikasi Tindak Lanjut
                </h4>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {selectedTicket.riwayatLog.map((log, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{log.oleh}</span>
                          <span className="px-2 py-0.2 rounded font-bold text-[9px] bg-slate-100 text-slate-700 uppercase">
                            {log.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{log.keterangan}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {formatDateTimeID(log.waktu)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Actions by Role */}
              {selectedTicket.status !== 'selesai' && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-emerald-900 text-xs">Form Tindak Lanjut Petugas</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Analisis Penyebab Masalah:</label>
                      <input
                        type="text"
                        value={actionAnalisis}
                        onChange={(e) => setActionAnalisis(e.target.value)}
                        placeholder="Penyebab kerak, bau, noda, atau kendala..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tindakan Perbaikan yang Dilakukan:</label>
                      <input
                        type="text"
                        value={actionPerbaikan}
                        onChange={(e) => setActionPerbaikan(e.target.value)}
                        placeholder="Chemical, mesin, atau penanganan khusus..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                    {selectedTicket.status === 'baru' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            selectedTicket.id,
                            'dalam_penanganan',
                            'Petugas operasional telah menerima tiket dan langsung menuju lokasi penanganan'
                          )
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                      >
                        Mulai Penanganan
                      </button>
                    )}

                    {(selectedTicket.status === 'dalam_penanganan' ||
                      selectedTicket.status === 'baru') && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            selectedTicket.id,
                            'menunggu_konfirmasi_client',
                            'Pekerjaan penanganan komplain telah selesai diselesaikan. Menunggu persetujuan client.'
                          )
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                      >
                        Selesaikan & Kirim ke Client
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Client Confirmation Panel (If status is menunggu_konfirmasi_client or reopen) */}
              {(selectedTicket.status === 'menunggu_konfirmasi_client' || isClient) && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-purple-900 text-xs">
                    Verifikasi & Konfirmasi Kepuasan Pelanggan (Client Portal)
                  </h4>
                  <p className="text-[11px] text-purple-800">
                    Sesuai Section 14: Tiket tidak boleh selesai sepihak oleh petugas; client wajib memverifikasi hasil sebelum tiket ditutup.
                  </p>

                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700">Rating Kepuasan Hasil:</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setActionRating(star)}
                          className={`p-1 cursor-pointer ${
                            star <= actionRating ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan Feedback Client:</label>
                    <input
                      type="text"
                      value={actionCatatanClient}
                      onChange={(e) => setActionCatatanClient(e.target.value)}
                      placeholder="Contoh: Pekerjaan cepat dan lantai kembali bersih kinclong. Terima kasih!"
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedTicket.id,
                          'dibuka_kembali',
                          `Client membuka kembali tiket komplain. Catatan: ${actionCatatanClient || 'Belum bersih total'}`
                        )
                      }
                      className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-lg cursor-pointer"
                    >
                      Buka Kembali (Belum Puas)
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedTicket.id,
                          'selesai',
                          `Client menyetujui hasil penanganan komplain dengan rating ${actionRating} bintang.`
                        )
                      }
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Konfirmasi Selesai & Tutup Tiket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-xs">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <MessageSquareWarning className="w-5 h-5 text-emerald-400" />
                <span>Pendaftaran Tiket Komplain Pelanggan</span>
              </h3>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Area Site Lokasi:</label>
                <select
                  value={formAreaId}
                  onChange={(e) => setFormAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namaArea} ({a.clientNama})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Komplain:</label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Toilet VIP Lt 3 Bau & Dispenser Sabun Kosong"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Masalah:</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Kebersihan Toilet & Perlengkapan">Kebersihan Toilet</option>
                    <option value="Lantai Bernoda / Licin">Lantai Bernoda / Licin</option>
                    <option value="Kaca / Jendela Kotor">Kaca / Jendela Kotor</option>
                    <option value="Karpet Kotor / Berbau">Karpet Kotor / Berbau</option>
                    <option value="Tempat Sampah Penuh / Bau">Tempat Sampah / TPS</option>
                    <option value="Sikap & Disiplin Petugas">Sikap Petugas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Prioritas (SLA):</label>
                  <select
                    value={formPrioritas}
                    onChange={(e) => setFormPrioritas(e.target.value as PrioritasComplain)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Darurat">Darurat (SLA 1 Jam)</option>
                    <option value="Tinggi">Tinggi (SLA 4 Jam)</option>
                    <option value="Sedang">Sedang (SLA 12 Jam)</option>
                    <option value="Rendah">Rendah (SLA 24 Jam)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian Detail Keluhan:</label>
                <textarea
                  rows={3}
                  value={formUraian}
                  onChange={(e) => setFormUraian(e.target.value)}
                  placeholder="Jelaskan kondisi kotoran, waktu kejadian, dan dampak operasional..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lampiran Foto Bukti (Opsional):</label>
                {formFotoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 h-28">
                    <img src={formFotoUrl} alt="Foto Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormFotoUrl('')}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 text-[10px]"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoTarget('complain');
                      setIsPhotoModalOpen(true);
                    }}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 font-semibold hover:border-emerald-500 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Ambil Foto Dari Kamera / Galeri</span>
                  </button>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Kirim Tiket Komplain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Capture Modal */}
      <ImageUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Lampirkan Foto Bukti"
        onImageSelected={(url) => {
          if (photoTarget === 'complain') setFormFotoUrl(url);
          if (photoTarget === 'after') setActionFotoAfter(url);
        }}
      />

      {/* Export Print Modal */}
      <ExportPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="Laporan Penanganan Komplain Pelanggan (Service Level Agreement)"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode="Periode Oktober 2026"
        headers={['No Tiket', 'Tanggal', 'Judul Komplain', 'Prioritas', 'Area', 'Status', 'SLA']}
        rows={filteredComplains.map((c) => [
          c.noTiket,
          formatDateID(c.tanggalMasuk),
          c.judul,
          c.prioritas,
          c.areaNama,
          c.status,
          `Target: ${c.targetResolveHours} Jam`,
        ])}
        preparedBy="Staff Customer Care / SPV"
        checkedBy="Area Koordinator"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Menara Thamrin"
        attachmentName="Rekap_Handling_Complain_Oktober_2026.pdf"
      />
    </div>
  );
};
