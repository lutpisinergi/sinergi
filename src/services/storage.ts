import {
  UserAccount,
  Client,
  AreaSite,
  MasterBarang,
  TransaksiInventory,
  Karyawan,
  TurnoverRecord,
  MasterCleaningProgramItem,
  RkbItem,
  ScheduleOffItem,
  KehadiranItem,
  LaporanKerjaHarianItem,
  HandlingComplainItem,
  CustomReportTemplate,
  CustomReportEntry,
  NotificationItem,
  AuditLogItem,
  AppSettings,
} from '../types/index.ts';

import {
  INITIAL_SETTINGS,
  INITIAL_CLIENTS,
  INITIAL_AREAS,
  INITIAL_USERS,
  INITIAL_BARANG,
  INITIAL_TRANSAKSI_INVENTORY,
  INITIAL_KARYAWAN,
  INITIAL_TURNOVER_RECORDS,
  INITIAL_MASTER_PROGRAM,
  INITIAL_RKB,
  INITIAL_SCHEDULE_OFF,
  INITIAL_KEHADIRAN,
  INITIAL_LAPORAN_HARIAN,
  INITIAL_COMPLAINS,
  INITIAL_CUSTOM_TEMPLATES,
  INITIAL_CUSTOM_ENTRIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './mockData.ts';

const STORAGE_KEYS = {
  CURRENT_USER: 'opsi_current_user',
  SETTINGS: 'opsi_settings',
  CLIENTS: 'opsi_clients',
  AREAS: 'opsi_areas',
  USERS: 'opsi_users',
  BARANG: 'opsi_barang',
  TRANSAKSI_INV: 'opsi_transaksi_inv',
  KARYAWAN: 'opsi_karyawan',
  TURNOVER: 'opsi_turnover',
  MASTER_PROGRAM: 'opsi_master_program',
  RKB: 'opsi_rkb',
  SCHEDULE_OFF: 'opsi_schedule_off',
  KEHADIRAN: 'opsi_kehadiran',
  LAPORAN_HARIAN: 'opsi_laporan_harian',
  COMPLAINS: 'opsi_complains',
  CUSTOM_TEMPLATES: 'opsi_custom_templates',
  CUSTOM_ENTRIES: 'opsi_custom_entries',
  NOTIFICATIONS: 'opsi_notifications',
  AUDIT_LOGS: 'opsi_audit_logs',
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading localStorage for key ${key}:`, err);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving localStorage for key ${key}:`, err);
  }
}

export class StorageService {
  // Current active logged-in user
  static getCurrentUser(): UserAccount {
    return getStorageItem<UserAccount>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  static setCurrentUser(user: UserAccount): void {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static getSettings(): AppSettings {
    return getStorageItem<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static saveSettings(settings: AppSettings): void {
    setStorageItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // Clients
  static getClients(): Client[] {
    return getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }

  static saveClients(clients: Client[]): void {
    setStorageItem(STORAGE_KEYS.CLIENTS, clients);
  }

  // Areas
  static getAreas(): AreaSite[] {
    return getStorageItem<AreaSite[]>(STORAGE_KEYS.AREAS, INITIAL_AREAS);
  }

  static saveAreas(areas: AreaSite[]): void {
    setStorageItem(STORAGE_KEYS.AREAS, areas);
  }

  // Users
  static getUsers(): UserAccount[] {
    return getStorageItem<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static saveUsers(users: UserAccount[]): void {
    setStorageItem(STORAGE_KEYS.USERS, users);
  }

  // Inventory
  static getBarang(): MasterBarang[] {
    return getStorageItem<MasterBarang[]>(STORAGE_KEYS.BARANG, INITIAL_BARANG);
  }

  static saveBarang(items: MasterBarang[]): void {
    setStorageItem(STORAGE_KEYS.BARANG, items);
  }

  static getTransaksiInventory(): TransaksiInventory[] {
    return getStorageItem<TransaksiInventory[]>(STORAGE_KEYS.TRANSAKSI_INV, INITIAL_TRANSAKSI_INVENTORY);
  }

  static saveTransaksiInventory(items: TransaksiInventory[]): void {
    setStorageItem(STORAGE_KEYS.TRANSAKSI_INV, items);
  }

  // Manpower
  static getKaryawan(): Karyawan[] {
    return getStorageItem<Karyawan[]>(STORAGE_KEYS.KARYAWAN, INITIAL_KARYAWAN);
  }

  static saveKaryawan(items: Karyawan[]): void {
    setStorageItem(STORAGE_KEYS.KARYAWAN, items);
  }

  static getTurnover(): TurnoverRecord[] {
    return getStorageItem<TurnoverRecord[]>(STORAGE_KEYS.TURNOVER, INITIAL_TURNOVER_RECORDS);
  }

  static saveTurnover(items: TurnoverRecord[]): void {
    setStorageItem(STORAGE_KEYS.TURNOVER, items);
  }

  // Master Program
  static getMasterProgram(): MasterCleaningProgramItem[] {
    return getStorageItem<MasterCleaningProgramItem[]>(STORAGE_KEYS.MASTER_PROGRAM, INITIAL_MASTER_PROGRAM);
  }

  static saveMasterProgram(items: MasterCleaningProgramItem[]): void {
    setStorageItem(STORAGE_KEYS.MASTER_PROGRAM, items);
  }

  // RKB
  static getRkb(): RkbItem[] {
    return getStorageItem<RkbItem[]>(STORAGE_KEYS.RKB, INITIAL_RKB);
  }

  static saveRkb(items: RkbItem[]): void {
    setStorageItem(STORAGE_KEYS.RKB, items);
  }

  // Schedule Off
  static getScheduleOff(): ScheduleOffItem[] {
    return getStorageItem<ScheduleOffItem[]>(STORAGE_KEYS.SCHEDULE_OFF, INITIAL_SCHEDULE_OFF);
  }

  static saveScheduleOff(items: ScheduleOffItem[]): void {
    setStorageItem(STORAGE_KEYS.SCHEDULE_OFF, items);
  }

  // Kehadiran
  static getKehadiran(): KehadiranItem[] {
    return getStorageItem<KehadiranItem[]>(STORAGE_KEYS.KEHADIRAN, INITIAL_KEHADIRAN);
  }

  static saveKehadiran(items: KehadiranItem[]): void {
    setStorageItem(STORAGE_KEYS.KEHADIRAN, items);
  }

  // Laporan Harian
  static getLaporanHarian(): LaporanKerjaHarianItem[] {
    return getStorageItem<LaporanKerjaHarianItem[]>(STORAGE_KEYS.LAPORAN_HARIAN, INITIAL_LAPORAN_HARIAN);
  }

  static saveLaporanHarian(items: LaporanKerjaHarianItem[]): void {
    setStorageItem(STORAGE_KEYS.LAPORAN_HARIAN, items);
  }

  // Complains
  static getComplains(): HandlingComplainItem[] {
    return getStorageItem<HandlingComplainItem[]>(STORAGE_KEYS.COMPLAINS, INITIAL_COMPLAINS);
  }

  static saveComplains(items: HandlingComplainItem[]): void {
    setStorageItem(STORAGE_KEYS.COMPLAINS, items);
  }

  // Custom Templates & Entries
  static getCustomTemplates(): CustomReportTemplate[] {
    return getStorageItem<CustomReportTemplate[]>(STORAGE_KEYS.CUSTOM_TEMPLATES, INITIAL_CUSTOM_TEMPLATES);
  }

  static saveCustomTemplates(items: CustomReportTemplate[]): void {
    setStorageItem(STORAGE_KEYS.CUSTOM_TEMPLATES, items);
  }

  static getCustomEntries(): CustomReportEntry[] {
    return getStorageItem<CustomReportEntry[]>(STORAGE_KEYS.CUSTOM_ENTRIES, INITIAL_CUSTOM_ENTRIES);
  }

  static saveCustomEntries(items: CustomReportEntry[]): void {
    setStorageItem(STORAGE_KEYS.CUSTOM_ENTRIES, items);
  }

  // Notifications
  static getNotifications(): NotificationItem[] {
    return getStorageItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static saveNotifications(items: NotificationItem[]): void {
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, items);
  }

  // Audit Logs
  static getAuditLogs(): AuditLogItem[] {
    return getStorageItem<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static logActivity(user: UserAccount, aksi: string, modul: string, rincian: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogItem = {
      id: `LOG-${Date.now()}`,
      waktu: new Date().toISOString(),
      userId: user.id,
      userName: user.nama,
      userRole: user.jabatan,
      aksi,
      modul,
      rincian,
    };
    logs.unshift(newLog);
    // Keep last 150 logs
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 150));
  }

  // Reset to initial factory seed
  static resetToFactorySeed(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}
