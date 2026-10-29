import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  Printer,
  Mail,
  History,
  Building,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import {
  UserAccount,
  MasterBarang,
  TransaksiInventory,
  JenisTransaksiInventory,
  JenisBarang,
} from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import {
  calculateUpdatedStock,
  formatIDR,
  formatNumberID,
  formatDateID,
} from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';
import { EmailSenderModal } from '../components/modals/EmailSenderModal.tsx';

interface InventoryViewProps {
  currentUser: UserAccount;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ currentUser }) => {
  const [barangList, setBarangList] = useState<MasterBarang[]>(StorageService.getBarang());
  const [transaksiList, setTransaksiList] = useState<TransaksiInventory[]>(
    StorageService.getTransaksiInventory()
  );

  const areas = StorageService.getAreas();

  // Tab State
  const [activeTab, setActiveTab] = useState<'rekap_stok' | 'transaksi' | 'kartu_stok'>('rekap_stok');

  // Filters
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStockCardBarangId, setSelectedStockCardBarangId] = useState<string>(
    barangList[0]?.id || ''
  );

  // New Transaction Modal State
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [trxJenis, setTrxJenis] = useState<JenisTransaksiInventory>('pemakaian_chemical');
  const [trxBarangId, setTrxBarangId] = useState<string>(barangList[0]?.id || '');
  const [trxJumlah, setTrxJumlah] = useState<number>(1);
  const [trxAreaTujuanId, setTrxAreaTujuanId] = useState<string>('AREA-BKS-01');
  const [trxKeterangan, setTrxKeterangan] = useState<string>('');
  const [trxError, setTrxError] = useState<string | null>(null);

  // Print & Email Modals
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Filtered master barang
  const filteredBarang = barangList.filter((b) => {
    if (filterJenis !== 'ALL' && b.jenis !== filterJenis) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.namaBarang.toLowerCase().includes(q) ||
        b.kodeBarang.toLowerCase().includes(q) ||
        b.kategori.toLowerCase().includes(q) ||
        b.lokasiPenyimpanan.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockCount = barangList.filter((b) => b.stokSaatIni <= b.stokMinimum).length;

  const handleOpenTrxModal = (type: JenisTransaksiInventory = 'pemakaian_chemical') => {
    setTrxJenis(type);
    setTrxError(null);
    setIsTrxModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTrxError(null);

    const targetBarang = barangList.find((b) => b.id === trxBarangId);
    if (!targetBarang) {
      setTrxError('Pilih barang terlebih dahulu.');
      return;
    }

    // Validation using our pure utility function
    const stockCheck = calculateUpdatedStock(targetBarang.stokSaatIni, trxJenis, trxJumlah);
    if (!stockCheck.isValid) {
      setTrxError(stockCheck.errorMessage || 'Transaksi tidak valid.');
      return;
    }

    const now = new Date();
    const noTransaksi = `TRX/INV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now().toString().slice(-4)}`;

    const areaAsal = areas.find((a) => a.id === targetBarang.areaId) || areas[0];
    const areaTujuan = trxJenis === 'transfer_area' ? areas.find((a) => a.id === trxAreaTujuanId) : undefined;

    const newTrx: TransaksiInventory = {
      id: `TRX-${Date.now()}`,
      noTransaksi,
      tanggal: now.toISOString().split('T')[0],
      jenisTransaksi: trxJenis,
      barangId: targetBarang.id,
      kodeBarang: targetBarang.kodeBarang,
      namaBarang: targetBarang.namaBarang,
      jumlah: trxJumlah,
      satuan: targetBarang.satuan,
      areaAsalId: areaAsal.id,
      areaAsalNama: areaAsal.namaArea,
      areaTujuanId: areaTujuan?.id,
      areaTujuanNama: areaTujuan?.namaArea,
      petugasId: currentUser.id,
      petugasNama: currentUser.nama,
      keterangan: trxKeterangan || 'Transaksi operasional harian',
      statusApproval: 'approved',
      createdAt: now.toISOString(),
    };

    // Update stock in state & storage
    const updatedBarang = barangList.map((b) => {
      if (b.id === targetBarang.id) {
        return {
          ...b,
          stokSaatIni: stockCheck.newStock,
        };
      }
      return b;
    });

    const updatedTrxList = [newTrx, ...transaksiList];

    setBarangList(updatedBarang);
    setTransaksiList(updatedTrxList);
    StorageService.saveBarang(updatedBarang);
    StorageService.saveTransaksiInventory(updatedTrxList);

    // Audit log
    StorageService.logActivity(
      currentUser,
      'TRANSAKSI_INVENTORY',
      'Inventory',
      `${trxJenis} ${targetBarang.namaBarang} (${trxJumlah} ${targetBarang.satuan}) - Stok Baru: ${stockCheck.newStock}`
    );

    setIsTrxModalOpen(false);
    setTrxKeterangan('');
    setTrxJumlah(1);
  };

  // Stock card calculations for selected item
  const selectedStockCardItem = barangList.find((b) => b.id === selectedStockCardBarangId) || barangList[0];
  const stockCardTransactions = transaksiList.filter(
    (t) => t.barangId === selectedStockCardItem?.id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-emerald-600" />
              <span>Sistem Manajemen Inventory, Chemical & Mesin</span>
            </h2>
            {lowStockCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {lowStockCount} Stok Di Bawah Minimum
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengendalian konsumsi chemical, mesin polisher/vacuum, dan perlengkapan janitor antar-area
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenTrxModal('pemakaian_chemical')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Pemakaian Chemical / Keluar
          </button>
          <button
            onClick={() => handleOpenTrxModal('barang_masuk')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            + Penerimaan / Masuk
          </button>
          <button
            onClick={() => handleOpenTrxModal('transfer_area')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            Transfer Antar-Area
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Cetak Rekap Stok A4"
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
          onClick={() => setActiveTab('rekap_stok')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'rekap_stok'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rekap Stok & Barang ({barangList.length})
        </button>
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'transaksi'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Riwayat Transaksi Mutasi ({transaksiList.length})
        </button>
        <button
          onClick={() => setActiveTab('kartu_stok')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'kartu_stok'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Buku Kartu Stok Per Item
        </button>
      </div>

      {/* TAB 1: Rekap Stok */}
      {activeTab === 'rekap_stok' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode barang, nama chemical, mesin, lokasi gudang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Jenis:</span>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="chemical">Chemical Pembersih</option>
                <option value="mesin">Mesin Polisher / Vacuum</option>
                <option value="equipment">Equipment & Alat Mop</option>
                <option value="consumable">Consumable & Tissue</option>
                <option value="safety">Safety / APD / K3</option>
              </select>
            </div>
          </div>

          {/* Master Barang Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kode & Nama Barang</th>
                    <th className="py-3 px-4">Jenis & Kategori</th>
                    <th className="py-3 px-4">Lokasi Penyimpanan</th>
                    <th className="py-3 px-4 text-center">Stok Min</th>
                    <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-right">Harga Satuan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBarang.map((item) => {
                    const isLow = item.stokSaatIni <= item.stokMinimum;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.namaBarang}</p>
                          <span className="font-mono text-[10px] text-slate-500 font-semibold">
                            {item.kodeBarang}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-700">
                            {item.jenis}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.kategori}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.lokasiPenyimpanan}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-500">
                          {item.stokMinimum} {item.satuan}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-md ${
                              isLow
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {item.stokSaatIni} {item.satuan}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatIDR(item.hargaSatuan)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded-full border border-rose-200">
                              Order Pengadaan!
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full border border-emerald-200">
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Riwayat Transaksi */}
      {activeTab === 'transaksi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No Transaksi & Tanggal</th>
                  <th className="py-3 px-4">Jenis Mutasi</th>
                  <th className="py-3 px-4">Barang & Jumlah</th>
                  <th className="py-3 px-4">Area Asal / Tujuan</th>
                  <th className="py-3 px-4">Petugas & Keterangan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaksiList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900">{t.noTransaksi}</p>
                      <p className="text-[11px] text-slate-500">{formatDateID(t.tanggal)}</p>
                    </td>

                    <td className="py-3 px-4">
                      {t.jenisTransaksi === 'barang_masuk' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Barang Masuk</span>
                        </span>
                      ) : t.jenisTransaksi === 'transfer_area' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                          <RefreshCw className="w-3 h-3" />
                          <span>Transfer Antar-Area</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Pemakaian / Keluar</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{t.namaBarang}</p>
                      <p className="text-emerald-700 font-bold text-xs">
                        {t.jumlah} {t.satuan}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">Dari: {t.areaAsalNama}</p>
                      {t.areaTujuanNama && (
                        <p className="text-[11px] text-blue-700 font-semibold">
                          Ke: {t.areaTujuanNama}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{t.petugasNama}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{t.keterangan}</p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full border border-emerald-200">
                        Disetujui
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Buku Kartu Stok */}
      {activeTab === 'kartu_stok' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Pilih Barang untuk Kartu Stok:</span>
              <select
                value={selectedStockCardBarangId}
                onChange={(e) => setSelectedStockCardBarangId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {barangList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.kodeBarang} — {b.namaBarang} (Sisa: {b.stokSaatIni} {b.satuan})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500">Saldo Awal: </span>
              <strong className="text-slate-800">{selectedStockCardItem?.saldoAwal} {selectedStockCardItem?.satuan}</strong>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-slate-500">Stok Saat Ini: </span>
              <strong className="text-emerald-700">{selectedStockCardItem?.stokSaatIni} {selectedStockCardItem?.satuan}</strong>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Kartu Stok Barang: {selectedStockCardItem?.namaBarang} ({selectedStockCardItem?.kodeBarang})
              </h3>
              <span className="text-xs text-slate-500">Lokasi: {selectedStockCardItem?.lokasiPenyimpanan}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4">No Transaksi</th>
                    <th className="py-2.5 px-4">Jenis Mutasi</th>
                    <th className="py-2.5 px-4 text-center">Masuk (+)</th>
                    <th className="py-2.5 px-4 text-center">Keluar (-)</th>
                    <th className="py-2.5 px-4">Petugas & Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50 font-semibold text-slate-600">
                    <td className="py-2 px-4">-</td>
                    <td className="py-2 px-4 font-mono">SALDO-AWAL</td>
                    <td className="py-2 px-4">Saldo Awal Periode</td>
                    <td className="py-2 px-4 text-center text-emerald-700 font-bold">
                      +{selectedStockCardItem?.saldoAwal}
                    </td>
                    <td className="py-2 px-4 text-center">-</td>
                    <td className="py-2 px-4 italic text-[11px]">Inventarisasi fisik awal site</td>
                  </tr>

                  {stockCardTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Belum ada mutasi transaksi pada periode ini untuk barang ini.
                      </td>
                    </tr>
                  ) : (
                    stockCardTransactions.map((tx) => {
                      const isIncoming = tx.jenisTransaksi === 'barang_masuk' || tx.jenisTransaksi === 'pengembalian_barang';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4">{formatDateID(tx.tanggal)}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-slate-800">
                            {tx.noTransaksi}
                          </td>
                          <td className="py-2.5 px-4 capitalize">{tx.jenisTransaksi.replace(/_/g, ' ')}</td>
                          <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">
                            {isIncoming ? `+${tx.jumlah}` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center text-rose-700 font-bold">
                            {!isIncoming ? `-${tx.jumlah}` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                            <strong className="text-slate-800">{tx.petugasNama}:</strong> {tx.keterangan}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {isTrxModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <span>Form Input Transaksi Mutasi Inventory</span>
              </h3>
              <button
                onClick={() => setIsTrxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 text-xs">
              {trxError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{trxError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi:</label>
                <select
                  value={trxJenis}
                  onChange={(e) => setTrxJenis(e.target.value as JenisTransaksiInventory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="pemakaian_chemical">Pemakaian Chemical Lapangan</option>
                  <option value="barang_masuk">Penerimaan Barang Masuk (PO)</option>
                  <option value="barang_keluar">Barang Keluar / Rusak</option>
                  <option value="transfer_area">Transfer Barang Antar-Area</option>
                  <option value="pengembalian_barang">Pengembalian Barang / Mesin</option>
                  <option value="penyesuaian_stok">Penyesuaian Stok Fisik (Stock Opname)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Barang:</label>
                <select
                  value={trxBarangId}
                  onChange={(e) => setTrxBarangId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
                >
                  {barangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.namaBarang} — [Tersedia: {b.stokSaatIni} {b.satuan}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Mutasi:</label>
                  <input
                    type="number"
                    min="1"
                    value={trxJumlah}
                    onChange={(e) => setTrxJumlah(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                {trxJenis === 'transfer_area' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Area Tujuan Transfer:</label>
                    <select
                      value={trxAreaTujuanId}
                      onChange={(e) => setTrxAreaTujuanId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.namaArea}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Alasan:</label>
                <textarea
                  rows={3}
                  value={trxKeterangan}
                  onChange={(e) => setTrxKeterangan(e.target.value)}
                  placeholder="Contoh: Pemakaian rutin cleaning koridor Lt. 1-10..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTrxModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Proses Transaksi Mutasi
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
        title="Laporan Status Stok & Inventarisasi Barang Operasional"
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Site & Gudang Pusat"
        periode="Oktober 2026"
        headers={['Kode', 'Nama Barang', 'Kategori', 'Jenis', 'Stok Min', 'Stok Saat Ini', 'Satuan', 'Harga Satuan']}
        rows={filteredBarang.map((b) => [
          b.kodeBarang,
          b.namaBarang,
          b.kategori,
          b.jenis,
          b.stokMinimum,
          b.stokSaatIni,
          b.satuan,
          formatIDR(b.hargaSatuan),
        ])}
        preparedBy="Admin Logistik Operasional"
        checkedBy="Supervisor Gudang"
        approvedBy="Operasional Manager"
      />

      {/* Email Sender Modal */}
      <EmailSenderModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        areaNama="Nasional (Semua Site)"
        attachmentName="Rekap_Status_Inventory_Oktober_2026.pdf"
      />
    </div>
  );
};
