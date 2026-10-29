export type UserRole =
  | 'direktur'
  | 'om'
  | 'admin_ops'
  | 'area_coord'
  | 'spv'
  | 'team_leader'
  | 'admin_area'
  | 'operator'
  | 'client';

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  nik: string;
  email: string;
  role: UserRole;
  areaId: string; // 'ALL' for Direktur / OM / Admin Ops, or specific Area ID
  clientId?: string; // If role is client
  jabatan: string;
  telepon: string;
  avatarUrl?: string;
  statusAktif: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  kode: string;
  namaPerusahaan: string;
  alamat: string;
  kota: string;
  contactPerson: string;
  telepon: string;
  email: string;
  jumlahArea: number;
  statusKontrak: 'aktif' | 'berakhir' | 'negosiasi';
}

export interface AreaSite {
  id: string;
  kode: string;
  namaArea: string;
  clientId: string;
  clientNama: string;
  lokasiKota: string;
  koordinatorId: string;
  koordinatorNama: string;
  targetManpower: number;
  minimumManpowerOff: number; // Minimum staffing threshold per day
  statusAktif: boolean;
}

export type JenisBarang = 'consumable' | 'chemical' | 'mesin' | 'equipment' | 'linen' | 'safety';

export interface MasterBarang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  jenis: JenisBarang;
  satuan: string;
  stokMinimum: number;
  saldoAwal: number;
  stokSaatIni: number;
  hargaSatuan: number;
  lokasiPenyimpanan: string;
  areaId: string; // Area spesifik atau 'GUDANG_PUSAT'
  areaNama: string;
  statusAktif: boolean;
  fotoUrl?: string;
}

export type JenisTransaksiInventory =
  | 'barang_masuk'
  | 'barang_keluar'
  | 'pemakaian_chemical'
  | 'pengembalian_barang'
  | 'transfer_area'
  | 'penyesuaian_stok';

export interface TransaksiInventory {
  id: string;
  noTransaksi: string;
  tanggal: string;
  jenisTransaksi: JenisTransaksiInventory;
  barangId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
  areaAsalId: string;
  areaAsalNama: string;
  areaTujuanId?: string;
  areaTujuanNama?: string;
  petugasId: string;
  petugasNama: string;
  keterangan: string;
  statusApproval: 'approved' | 'pending' | 'rejected';
  alasanPenyesuaian?: string;
  createdAt: string;
}

export type StatusKaryawan = 'aktif' | 'cuti' | 'mutasi' | 'resign' | 'nonaktif';

export interface Karyawan {
  id: string;
  nik: string;
  namaLengkap: string;
  jabatan: string;
  role: UserRole;
  areaId: string;
  areaNama: string;
  clientId?: string;
  clientNama?: string;
  tanggalMulaiKerja: string;
  statusKerja: StatusKaryawan;
  tanggalBerakhirKerja?: string;
  noHp: string;
  email: string;
  riwayatMutasi: Array<{
    tanggal: string;
    dariArea: string;
    keArea: string;
    dariJabatan: string;
    keJabatan: string;
    keterangan: string;
  }>;
  alasanResign?: string;
  karyawanPenggantiNik?: string;
  karyawanPenggantiNama?: string;
}

export interface TurnoverRecord {
  id: string;
  periodeBulan: string; // YYYY-MM
  areaId: string;
  areaNama: string;
  karyawanAwal: number;
  karyawanMasuk: number;
  karyawanKeluar: number;
  karyawanAkhir: number;
  rataRataKaryawan: number;
  turnoverRatePercent: number;
  keterangan: string;
}

export interface MasterCleaningProgramItem {
  id: string;
  tahun: number;
  areaId: string;
  areaNama: string;
  clientId: string;
  clientNama: string;
  kategoriPekerjaan: string; // e.g. Floor Care, Glass Cleaning, Washroom, High Level
  namaPekerjaan: string;
  lokasiObjek: string; // e.g. Lobby Lt 1, Toilet Pria Lt 2, Fasad Luar
  frekuensi: 'Harian' | 'Mingguan' | '2 Mingguan' | 'Bulanan' | 'Triwulan' | 'Semesteran' | 'Tahunan';
  targetPekerjaanTahunan: number;
  satuan: string; // e.g. Area, m2, Room, Unit
  bulanPelaksanaan: number[]; // e.g. [1,2,3,4,5,6,7,8,9,10,11,12]
  pic: string;
  catatan?: string;
  statusApproval: 'draft' | 'menunggu_approval' | 'disetujui' | 'ditolak';
  version: number;
}

export interface RkbItem {
  id: string;
  programTahunanId: string;
  tahun: number;
  bulan: number; // 1 - 12
  areaId: string;
  areaNama: string;
  clientId: string;
  clientNama: string;
  kategoriPekerjaan: string;
  namaPekerjaan: string;
  lokasiObjek: string;
  targetBulanan: number;
  realisasiBulanan: number;
  satuan: string;
  pic: string;
  statusApproval: 'draft' | 'menunggu_approval' | 'disetujui' | 'direvisi' | 'ditutup';
  mingguJadwal: {
    w1: boolean;
    w2: boolean;
    w3: boolean;
    w4: boolean;
  };
  alasanPerubahan?: string;
  version: number;
}

export interface ScheduleOffItem {
  id: string;
  periodeBulan: string; // YYYY-MM
  areaId: string;
  areaNama: string;
  karyawanId: string;
  nik: string;
  namaKaryawan: string;
  jabatan: string;
  tanggalOff: string; // YYYY-MM-DD
  jenisOff: 'Off Rutin' | 'Cuti Tahunan' | 'Cuti Khusus' | 'Izin Resmi' | 'Tukar Shift';
  karyawanPenggantiNama?: string;
  keterangan?: string;
  statusApproval: 'menunggu' | 'disetujui' | 'ditolak';
}

export interface KehadiranItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  areaId: string;
  areaNama: string;
  clientId: string;
  karyawanId: string;
  nik: string;
  namaKaryawan: string;
  jadwalShift: 'Pagi (06:00-14:00)' | 'Middle (10:00-18:00)' | 'Sore (14:00-22:00)' | 'Malam (22:00-06:00)' | 'Normal (08:00-17:00)';
  jamMasuk: string;
  jamPulang: string;
  statusKehadiran: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Cuti' | 'Off' | 'Alpha';
  menitKeterlambatan: number;
  keterangan: string;
  petugasInput: string;
  waktuInput: string;
}

export interface LaporanKerjaHarianItem {
  id: string;
  noLaporan: string;
  tanggal: string;
  waktu: string;
  areaId: string;
  areaNama: string;
  clientId: string;
  clientNama: string;
  namaPelapor: string;
  jabatanPelapor: string;
  jenisPekerjaan: string;
  lokasiObjek: string;
  uraianPekerjaan: string;
  hasilPekerjaan: string;
  kendala?: string;
  tindakLanjut?: string;
  fotoBeforeUrl?: string;
  fotoProgressUrl?: string;
  fotoAfterUrl?: string;
  statusPemeriksaan: 'menunggu_verifikasi' | 'disetujui_spv' | 'perlu_perbaikan';
  catatanSupervisor?: string;
  diperiksaOleh?: string;
  waktuDiperiksa?: string;
}

export type StatusComplain =
  | 'baru'
  | 'notifikasi_terkirim'
  | 'diterima_petugas'
  | 'dalam_penanganan'
  | 'menunggu_verifikasi'
  | 'menunggu_konfirmasi_client'
  | 'selesai'
  | 'dibuka_kembali';

export type PrioritasComplain = 'Tinggi' | 'Sedang' | 'Rendah' | 'Darurat';

export interface HandlingComplainItem {
  id: string;
  noTiket: string;
  tanggalMasuk: string; // ISO
  clientId: string;
  clientNama: string;
  areaId: string;
  areaNama: string;
  namaPelapor: string;
  kontakPelapor: string;
  kategori: string; // Kebersihan Toilet, Lantai Bernoda, Kaca Berdebu, Bau Tak Sedap, Fasilitas Rusak, dll
  prioritas: PrioritasComplain;
  judul: string;
  uraian: string;
  fotoComplainUrl?: string;
  targetResponseHours: number; // e.g. 2 hours
  targetResolveHours: number; // e.g. 24 hours
  slaDeadline: string; // ISO
  status: StatusComplain;
  picPetugasNama?: string;
  picPetugasHp?: string;
  analisisPenyebab?: string;
  tindakanPerbaikan?: string;
  fotoBeforeUrl?: string;
  fotoAfterUrl?: string;
  tanggalPenyelesaian?: string;
  approvalClientTimestamp?: string;
  ratingKepuasan?: number; // 1 - 5 stars
  catatanClient?: string;
  riwayatLog: Array<{
    waktu: string;
    oleh: string;
    status: StatusComplain;
    keterangan: string;
  }>;
}

export interface CustomReportTemplate {
  id: string;
  namaLaporan: string;
  deskripsi: string;
  kategori: string;
  targetArea: string; // 'ALL' or areaId
  dibuatOleh: string;
  fieldList: Array<{
    id: string;
    label: string;
    tipe: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file';
    wajib: boolean;
    options?: string[]; // If select
  }>;
  statusAktif: boolean;
  createdAt: string;
}

export interface CustomReportEntry {
  id: string;
  templateId: string;
  templateNama: string;
  noDokumen: string;
  tanggal: string;
  areaId: string;
  areaNama: string;
  pelaporNama: string;
  status: 'draft' | 'diajukan' | 'diperiksa' | 'disetujui';
  dataValues: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  kategori: 'complain' | 'inventory' | 'rkb' | 'kehadiran' | 'approval';
  judul: string;
  pesan: string;
  waktu: string;
  isRead: boolean;
  linkMenu: string;
  areaId?: string;
  level: 'info' | 'warning' | 'urgent';
}

export interface AuditLogItem {
  id: string;
  waktu: string;
  userId: string;
  userName: string;
  userRole: string;
  aksi: string;
  modul: string;
  rincian: string;
}

export interface AppSettings {
  namaPerusahaan: string;
  divisi: string;
  namaSistem: string;
  logoUrl: string;
  warnaPrimer: string;
  formatTanggal: string;
  zonaWaktu: string;
  mataUang: string;
  slaComplainJamDefault: {
    darurat: number;
    tinggi: number;
    sedang: number;
    rendah: number;
  };
  emailPengirimNotifikasi: string;
  notifikasiEmailAktif: boolean;
  notifikasiWaAktif: boolean;
  smtpConfig: {
    host: string;
    port: number;
    username: string;
    isConfigured: boolean;
  };
}
