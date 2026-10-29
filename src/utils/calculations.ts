/**
 * Pure calculation logic for OPSi (Operational Performance System)
 * PT. SINERGI Integra Services
 */

export interface RealisasiResult {
  persentase: number;
  formattedPersentase: string;
  status: 'tercapai' | 'dalam_progress' | 'belum_mulai' | 'tanpa_target';
  statusLabel: string;
  badgeClass: string;
}

export function calculateRealisasiPercentage(selesaiValid: number, targetPekerjaan: number): RealisasiResult {
  if (targetPekerjaan <= 0) {
    if (selesaiValid > 0) {
      return {
        persentase: 100,
        formattedPersentase: '100% (Extra)',
        status: 'tercapai',
        statusLabel: 'Pekerjaan Tambahan',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    return {
      persentase: 0,
      formattedPersentase: 'N/A',
      status: 'tanpa_target',
      statusLabel: 'Tanpa Target',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  const rawPercent = (Math.max(0, selesaiValid) / targetPekerjaan) * 100;
  const rounded = Math.round(rawPercent * 10) / 10;

  if (rounded >= 100) {
    return {
      persentase: rounded,
      formattedPersentase: `${formatNumberID(rounded, 1)}%`,
      status: 'tercapai',
      statusLabel: 'Tercapai 100%',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  } else if (rounded > 0) {
    return {
      persentase: rounded,
      formattedPersentase: `${formatNumberID(rounded, 1)}%`,
      status: 'dalam_progress',
      statusLabel: 'Dalam Progres',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    };
  } else {
    return {
      persentase: 0,
      formattedPersentase: '0%',
      status: 'belum_mulai',
      statusLabel: 'Belum Terealisasi',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }
}

export interface TurnoverCalculationResult {
  ratePercent: number;
  formattedRate: string;
  pembilang: number; // Karyawan keluar
  penyebut: number; // Rata-rata karyawan aktif
  karyawanAwal: number;
  karyawanMasuk: number;
  karyawanKeluar: number;
  karyawanAkhir: number;
  deskripsiRumus: string;
}

export function calculateTurnoverRate(
  karyawanAwal: number,
  karyawanMasuk: number,
  karyawanKeluar: number
): TurnoverCalculationResult {
  const akhir = Math.max(0, karyawanAwal + karyawanMasuk - karyawanKeluar);
  const rataRata = (karyawanAwal + akhir) / 2;

  let rate = 0;
  if (rataRata > 0) {
    rate = (karyawanKeluar / rataRata) * 100;
  }
  const rounded = Math.round(rate * 10) / 10;

  return {
    ratePercent: rounded,
    formattedRate: `${formatNumberID(rounded, 1)}%`,
    pembilang: karyawanKeluar,
    penyebut: rataRata,
    karyawanAwal,
    karyawanMasuk,
    karyawanKeluar,
    karyawanAkhir: akhir,
    deskripsiRumus: `(${karyawanKeluar} keluar / ${rataRata.toFixed(1)} rata-rata staf) × 100%`,
  };
}

export interface AttendanceSummaryResult {
  totalLog: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  cuti: number;
  off: number;
  alpha: number;
  wajibKerja: number; // total - off - cuti
  totalHadir: number; // hadir + terlambat
  persentaseKehadiran: number;
  formattedKehadiran: string;
  persentaseKeterlambatan: number;
  formattedKeterlambatan: string;
}

export function calculateAttendanceSummary(
  statuses: Array<{ statusKehadiran: string }>
): AttendanceSummaryResult {
  let hadir = 0;
  let terlambat = 0;
  let izin = 0;
  let sakit = 0;
  let cuti = 0;
  let off = 0;
  let alpha = 0;

  for (const item of statuses) {
    switch (item.statusKehadiran) {
      case 'Hadir':
        hadir++;
        break;
      case 'Terlambat':
        terlambat++;
        break;
      case 'Izin':
        izin++;
        break;
      case 'Sakit':
        sakit++;
        break;
      case 'Cuti':
        cuti++;
        break;
      case 'Off':
        off++;
        break;
      case 'Alpha':
        alpha++;
        break;
      default:
        hadir++;
        break;
    }
  }

  const totalLog = statuses.length;
  const wajibKerja = Math.max(0, totalLog - off - cuti);
  const totalHadir = hadir + terlambat;

  let pctHadir = 0;
  let pctTerlambat = 0;

  if (wajibKerja > 0) {
    pctHadir = Math.round((totalHadir / wajibKerja) * 1000) / 10;
    pctTerlambat = Math.round((terlambat / wajibKerja) * 1000) / 10;
  }

  return {
    totalLog,
    hadir,
    terlambat,
    izin,
    sakit,
    cuti,
    off,
    alpha,
    wajibKerja,
    totalHadir,
    persentaseKehadiran: pctHadir,
    formattedKehadiran: `${formatNumberID(pctHadir, 1)}%`,
    persentaseKeterlambatan: pctTerlambat,
    formattedKeterlambatan: `${formatNumberID(pctTerlambat, 1)}%`,
  };
}

export interface StockChangeItem {
  jenisTransaksi: string;
  jumlah: number;
}

export function calculateUpdatedStock(
  currentStock: number,
  jenisTransaksi: string,
  jumlah: number
): { newStock: number; isValid: boolean; errorMessage?: string } {
  if (jumlah <= 0) {
    return {
      newStock: currentStock,
      isValid: false,
      errorMessage: 'Jumlah transaksi harus lebih dari 0',
    };
  }

  let delta = 0;
  if (jenisTransaksi === 'barang_masuk' || jenisTransaksi === 'pengembalian_barang') {
    delta = jumlah;
  } else if (
    jenisTransaksi === 'barang_keluar' ||
    jenisTransaksi === 'pemakaian_chemical' ||
    jenisTransaksi === 'transfer_area'
  ) {
    delta = -jumlah;
  } else if (jenisTransaksi === 'penyesuaian_stok') {
    // penyesuaian sets the absolute stock directly or relative
    return {
      newStock: jumlah,
      isValid: true,
    };
  }

  const finalStock = currentStock + delta;
  if (finalStock < 0) {
    return {
      newStock: currentStock,
      isValid: false,
      errorMessage: `Stok tidak mencukupi (Tersedia: ${currentStock}, Dibutuhkan: ${jumlah})`,
    };
  }

  return {
    newStock: finalStock,
    isValid: true,
  };
}

export interface ComplainSLAResult {
  hoursElapsed: number;
  hoursRemaining: number;
  isBreached: boolean;
  statusText: string;
  badgeClass: string;
  slaTargetHours: number;
}

export function calculateComplainSLA(
  createdAtIso: string,
  targetHours: number,
  resolvedAtIso?: string | null,
  referenceNowIso?: string
): ComplainSLAResult {
  const createdTime = new Date(createdAtIso).getTime();
  const endTime = resolvedAtIso ? new Date(resolvedAtIso).getTime() : (referenceNowIso ? new Date(referenceNowIso).getTime() : Date.now());

  const elapsedMs = Math.max(0, endTime - createdTime);
  const hoursElapsed = Math.round((elapsedMs / (1000 * 60 * 60)) * 10) / 10;
  const hoursRemaining = Math.round((targetHours - hoursElapsed) * 10) / 10;
  const isBreached = hoursElapsed > targetHours;

  if (resolvedAtIso) {
    if (isBreached) {
      return {
        hoursElapsed,
        hoursRemaining: 0,
        isBreached: true,
        statusText: `Selesai (${hoursElapsed}j - Melewati SLA ${targetHours}j)`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        slaTargetHours: targetHours,
      };
    }
    return {
      hoursElapsed,
      hoursRemaining: Math.max(0, hoursRemaining),
      isBreached: false,
      statusText: `Selesai tepat waktu (${hoursElapsed}j dari SLA ${targetHours}j)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      slaTargetHours: targetHours,
    };
  }

  if (isBreached) {
    return {
      hoursElapsed,
      hoursRemaining: 0,
      isBreached: true,
      statusText: `SLA Lewat +${Math.abs(hoursRemaining)} jam!`,
      badgeClass: 'bg-red-500 text-white font-bold animate-pulse',
      slaTargetHours: targetHours,
    };
  }

  if (hoursRemaining <= 2) {
    return {
      hoursElapsed,
      hoursRemaining,
      isBreached: false,
      statusText: `Mendekati SLA: sisa ${hoursRemaining} jam`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      slaTargetHours: targetHours,
    };
  }

  return {
    hoursElapsed,
    hoursRemaining,
    isBreached: false,
    statusText: `Sisa ${hoursRemaining} jam (Target ${targetHours}j)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    slaTargetHours: targetHours,
  };
}

/** Indonesian formatters */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberID(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateID(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTimeID(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(d) + ' WIB';
  } catch {
    return dateString;
  }
}
