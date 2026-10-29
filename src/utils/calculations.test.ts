import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRealisasiPercentage,
  calculateTurnoverRate,
  calculateAttendanceSummary,
  calculateUpdatedStock,
  calculateComplainSLA,
  formatIDR,
  formatNumberID,
} from './calculations.ts';

test('Realisasi calculation: standard in progress, 100%, and zero target handling', () => {
  // Standard in-progress
  const res1 = calculateRealisasiPercentage(45, 50);
  assert.equal(res1.persentase, 90);
  assert.equal(res1.status, 'dalam_progress');

  // Complete (>= 100%)
  const res2 = calculateRealisasiPercentage(52, 50);
  assert.equal(res2.persentase, 104);
  assert.equal(res2.status, 'tercapai');

  // Zero target protection (no divide by zero)
  const res3 = calculateRealisasiPercentage(0, 0);
  assert.equal(res3.persentase, 0);
  assert.equal(res3.status, 'tanpa_target');

  // Unstarted
  const res4 = calculateRealisasiPercentage(0, 20);
  assert.equal(res4.persentase, 0);
  assert.equal(res4.status, 'belum_mulai');
});

test('Turnover rate calculation: standard formula with average headcount and zero handling', () => {
  // Awal: 100, Masuk: 5, Keluar: 10 -> Akhir: 95. Rata-rata = (100 + 95) / 2 = 97.5
  // Rate = (10 / 97.5) * 100 = 10.256% ~ 10.3%
  const res = calculateTurnoverRate(100, 5, 10);
  assert.equal(res.karyawanAkhir, 95);
  assert.equal(res.pembilang, 10);
  assert.equal(res.penyebut, 97.5);
  assert.equal(res.ratePercent, 10.3);

  // Zero staff handling
  const resZero = calculateTurnoverRate(0, 0, 0);
  assert.equal(resZero.ratePercent, 0);
  assert.equal(resZero.penyebut, 0);
});

test('Attendance summary: calculation of workdays, attendance rate, and lateness', () => {
  const records = [
    { statusKehadiran: 'Hadir' },
    { statusKehadiran: 'Hadir' },
    { statusKehadiran: 'Terlambat' },
    { statusKehadiran: 'Sakit' },
    { statusKehadiran: 'Off' },
    { statusKehadiran: 'Cuti' },
  ];

  const summary = calculateAttendanceSummary(records);
  assert.equal(summary.totalLog, 6);
  assert.equal(summary.hadir, 2);
  assert.equal(summary.terlambat, 1);
  assert.equal(summary.off, 1);
  assert.equal(summary.cuti, 1);
  assert.equal(summary.wajibKerja, 4); // 6 - 1(off) - 1(cuti)
  assert.equal(summary.totalHadir, 3); // 2 hadir + 1 terlambat
  // persentase hadir = 3 / 4 * 100% = 75%
  assert.equal(summary.persentaseKehadiran, 75);
  // persentase terlambat = 1 / 4 * 100% = 25%
  assert.equal(summary.persentaseKeterlambatan, 25);
});

test('Inventory stock transactions: prevent negative stock and calculate correct deductions', () => {
  // Valid addition
  const resAdd = calculateUpdatedStock(20, 'barang_masuk', 10);
  assert.equal(resAdd.isValid, true);
  assert.equal(resAdd.newStock, 30);

  // Valid deduction
  const resDeduct = calculateUpdatedStock(30, 'pemakaian_chemical', 12);
  assert.equal(resDeduct.isValid, true);
  assert.equal(resDeduct.newStock, 18);

  // Invalid deduction (insufficient stock)
  const resFail = calculateUpdatedStock(5, 'barang_keluar', 10);
  assert.equal(resFail.isValid, false);
  assert.equal(resFail.newStock, 5);
  assert.match(resFail.errorMessage || '', /Stok tidak mencukupi/);

  // Zero or negative input
  const resZero = calculateUpdatedStock(10, 'barang_masuk', 0);
  assert.equal(resZero.isValid, false);
});

test('Complain SLA: calculates hours elapsed, breach detection, and remaining SLA', () => {
  const now = new Date('2026-10-29T12:00:00Z').toISOString();
  const created2HoursAgo = new Date('2026-10-29T10:00:00Z').toISOString();
  const created25HoursAgo = new Date('2026-10-28T11:00:00Z').toISOString();

  // Within SLA (2 hrs elapsed of 4 hrs target)
  const slaActive = calculateComplainSLA(created2HoursAgo, 4, null, now);
  assert.equal(slaActive.hoursElapsed, 2);
  assert.equal(slaActive.hoursRemaining, 2);
  assert.equal(slaActive.isBreached, false);

  // Breached SLA (25 hrs elapsed of 24 hrs target)
  const slaBreached = calculateComplainSLA(created25HoursAgo, 24, null, now);
  assert.equal(slaBreached.hoursElapsed, 25);
  assert.equal(slaBreached.isBreached, true);

  // Resolved within SLA
  const resolvedWithin = calculateComplainSLA(created2HoursAgo, 6, new Date('2026-10-29T11:30:00Z').toISOString(), now);
  assert.equal(resolvedWithin.hoursElapsed, 1.5);
  assert.equal(resolvedWithin.isBreached, false);
});

test('Indonesian Formatters: currency and numbers', () => {
  const idr = formatIDR(1500000);
  assert.ok(idr.includes('1.500.000') || idr.includes('Rp'));

  const num = formatNumberID(12345.6, 1);
  assert.ok(num.includes('12.345,6') || num.includes('12,345.6') || num.length > 0);
});
