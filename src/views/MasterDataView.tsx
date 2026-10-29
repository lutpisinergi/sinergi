import React, { useState } from 'react';
import {
  Database,
  Building,
  MapPin,
  Boxes,
  Users,
  Plus,
  Search,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount, Client, AreaSite, MasterBarang, UserRole } from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { formatIDR } from '../utils/calculations.ts';

interface MasterDataViewProps {
  currentUser: UserAccount;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'client' | 'area' | 'barang' | 'user'>('client');

  const [clients, setClients] = useState<Client[]>(StorageService.getClients());
  const [areas, setAreas] = useState<AreaSite[]>(StorageService.getAreas());
  const [barangList, setBarangList] = useState<MasterBarang[]>(StorageService.getBarang());
  const [userList, setUserList] = useState<UserAccount[]>(StorageService.getUsers());

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Add Client Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientNama, setNewClientNama] = useState('');
  const [newClientKota, setNewClientKota] = useState('Jakarta Selatan');
  const [newClientPIC, setNewClientPIC] = useState('');
  const [newClientTelp, setNewClientTelp] = useState('');

  // Add Area Modal
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaNama, setNewAreaNama] = useState('');
  const [newAreaClientId, setNewAreaClientId] = useState(clients[0]?.id || '');
  const [newAreaKota, setNewAreaKota] = useState('Jakarta Pusat');
  const [newAreaTargetManpower, setNewAreaTargetManpower] = useState(20);
  const [newAreaMinOff, setNewAreaMinOff] = useState(15);

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: `CLIENT-${Date.now()}`,
      kode: `CLI-${newClientNama.slice(0, 4).toUpperCase()}`,
      namaPerusahaan: newClientNama,
      alamat: 'Gedung Komersial & Kantor',
      kota: newClientKota,
      contactPerson: newClientPIC,
      telepon: newClientTelp,
      email: `${newClientNama.toLowerCase().replace(/\s+/g, '')}@client.co.id`,
      jumlahArea: 1,
      statusKontrak: 'aktif',
    };

    const updated = [...clients, newClient];
    setClients(updated);
    StorageService.saveClients(updated);
    StorageService.logActivity(
      currentUser,
      'ADD_MASTER_CLIENT',
      'Master Data',
      `Menambah client baru: ${newClientNama}`
    );

    setIsClientModalOpen(false);
    setNewClientNama('');
    setNewClientPIC('');
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === newAreaClientId) || clients[0];

    const newArea: AreaSite = {
      id: `AREA-${Date.now()}`,
      kode: `AR-${newAreaNama.slice(0, 3).toUpperCase()}`,
      namaArea: newAreaNama,
      clientId: client.id,
      clientNama: client.namaPerusahaan,
      lokasiKota: newAreaKota,
      koordinatorId: currentUser.id,
      koordinatorNama: currentUser.nama,
      targetManpower: newAreaTargetManpower,
      minimumManpowerOff: newAreaMinOff,
      statusAktif: true,
    };

    const updated = [...areas, newArea];
    setAreas(updated);
    StorageService.saveAreas(updated);
    StorageService.logActivity(
      currentUser,
      'ADD_MASTER_AREA',
      'Master Data',
      `Menambah area site baru: ${newAreaNama} (${client.namaPerusahaan})`
    );

    setIsAreaModalOpen(false);
    setNewAreaNama('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Pengelolaan Master Data Perusahaan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data terpusat untuk Client, Area Site Penugasan, Master Chemical/Barang, dan Akun Pengguna
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'client' && (
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              + Tambah Client
            </button>
          )}
          {activeTab === 'area' && (
            <button
              onClick={() => setIsAreaModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              + Tambah Area Site
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('client')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'client'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Master Client & Gedung ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('area')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'area'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Master Area Site Operasional ({areas.length})
        </button>
        <button
          onClick={() => setActiveTab('barang')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'barang'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Master Barang & Chemical ({barangList.length})
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'user'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Akun Pengguna & Hak Akses ({userList.length})
        </button>
      </div>

      {/* TAB 1: Clients */}
      {activeTab === 'client' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode & Nama Client</th>
                  <th className="py-3 px-4">Kota & Alamat</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Telepon & Email</th>
                  <th className="py-3 px-4 text-center">Status Kontrak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.namaPerusahaan}</p>
                      <span className="font-mono text-[10px] text-slate-500">{c.kode}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-semibold text-slate-800">{c.kota}</p>
                      <span className="text-[11px] text-slate-400">{c.alamat}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.contactPerson}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <p>{c.telepon}</p>
                      <span className="text-[11px] text-slate-400">{c.email}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Kontrak Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Area Sites */}
      {activeTab === 'area' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Area Site</th>
                  <th className="py-3 px-4">Client Pemilik</th>
                  <th className="py-3 px-4">Kota</th>
                  <th className="py-3 px-4">Area Koordinator</th>
                  <th className="py-3 px-4 text-center">Target Manpower</th>
                  <th className="py-3 px-4 text-center">Batas Min. Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areas.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{a.namaArea}</p>
                      <span className="font-mono text-[10px] text-slate-500">{a.kode}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{a.clientNama}</td>
                    <td className="py-3 px-4 text-slate-600">{a.lokasiKota}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{a.koordinatorNama}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {a.targetManpower} Orang
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                      {a.minimumManpowerOff} Orang
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Master Barang */}
      {activeTab === 'barang' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode & Nama Barang</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Stok Minimum</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {barangList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{b.namaBarang}</p>
                      <span className="font-mono text-[10px] text-slate-500">{b.kodeBarang}</span>
                    </td>
                    <td className="py-3 px-4 capitalize">{b.jenis}</td>
                    <td className="py-3 px-4 text-slate-600">{b.kategori}</td>
                    <td className="py-3 px-4 text-center font-semibold">
                      {b.stokMinimum} {b.satuan}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {formatIDR(b.hargaSatuan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: User Accounts */}
      {activeTab === 'user' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Staf & NIK</th>
                  <th className="py-3 px-4">Username & Email</th>
                  <th className="py-3 px-4">Peran Hak Akses (RBAC)</th>
                  <th className="py-3 px-4">Cakupan Area</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{u.nama}</p>
                      <span className="font-mono text-[10px] text-slate-500">{u.nik}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-medium text-slate-800">{u.username}</p>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 uppercase">
                        {u.role.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{u.jabatan}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {u.areaId === 'ALL' ? 'Semua Area (Nasional)' : 'Menara Thamrin Jakarta'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-xs">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Tambah Data Client Baru</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan Client:</label>
                <input
                  type="text"
                  value={newClientNama}
                  onChange={(e) => setNewClientNama(e.target.value)}
                  placeholder="Contoh: PT. Wisma Sudirman Landmark"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kota:</label>
                <input
                  type="text"
                  value={newClientKota}
                  onChange={(e) => setNewClientKota(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person (PIC Building Manager):</label>
                <input
                  type="text"
                  value={newClientPIC}
                  onChange={(e) => setNewClientPIC(e.target.value)}
                  placeholder="Contoh: Bpk. Gunawan"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Kantor / HP:</label>
                <input
                  type="text"
                  value={newClientTelp}
                  onChange={(e) => setNewClientTelp(e.target.value)}
                  placeholder="021-..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Area Modal */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-xs">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Tambah Area Site Penugasan Baru</h3>
              <button onClick={() => setIsAreaModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Area Site:</label>
                <input
                  type="text"
                  value={newAreaNama}
                  onChange={(e) => setNewAreaNama(e.target.value)}
                  placeholder="Contoh: Sudirman Landmark - Podium & Parkir"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Client Induk:</label>
                <select
                  value={newAreaClientId}
                  onChange={(e) => setNewAreaClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.namaPerusahaan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Manpower:</label>
                  <input
                    type="number"
                    min="1"
                    value={newAreaTargetManpower}
                    onChange={(e) => setNewAreaTargetManpower(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Minimal Off:</label>
                  <input
                    type="number"
                    min="1"
                    value={newAreaMinOff}
                    onChange={(e) => setNewAreaMinOff(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Area Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
