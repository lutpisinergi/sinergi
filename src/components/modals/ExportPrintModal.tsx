import React from 'react';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';
import { formatDateID } from '../../utils/calculations.ts';

interface ExportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  areaNama?: string;
  periode?: string;
  headers: string[];
  rows: (string | number)[][];
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  footerNotes?: string;
}

export const ExportPrintModal: React.FC<ExportPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  areaNama = 'Semua Area Operasional',
  periode = 'Oktober 2026',
  headers,
  rows,
  preparedBy = 'Staff Operasional Site',
  checkedBy = 'Supervisor / Area Koordinator',
  approvedBy = 'Operasional Manager',
  footerNotes,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvContent = [
      `"Laporan: ${title}"`,
      `"Perusahaan: PT. SINERGI Integra Services"`,
      `"Area: ${areaNama}"`,
      `"Periode: ${periode}"`,
      `"Tanggal Cetak: ${formatDateID(new Date().toISOString())}"`,
      '',
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Action Header - Hidden on Print */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Preview Dokumen Cetak Standar A4</h3>
              <p className="text-xs text-slate-400">Siap cetak atau ekspor ke PDF & spreadsheet resmi perusahaan</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor CSV / Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
              aria-label="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 Layout Styled) */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-slate-100 flex justify-center">
          <div className="bg-white p-8 sm:p-12 rounded-lg shadow-md max-w-[800px] w-full text-slate-900 text-xs leading-relaxed border border-slate-200 print:border-0 print:shadow-none print:p-0">
            {/* Kop Surat PT. SINERGI Integra Services */}
            <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-emerald-700 rounded-lg flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
                  SIS
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                    PT. SINERGI Integra Services
                  </h1>
                  <p className="text-[11px] font-semibold text-emerald-800">
                    DIVISI OPERASIONAL — FACILITY SERVICES & HOUSEKEEPING MANAGEMENT
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Gedung Menara Sinergi Lt. 8, Jl. TB Simatupang Kav. 22, Jakarta Selatan 12430
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Telp: (021) 7884-5500 | Email: operasional@sinergi-services.co.id | www.sinergi-services.co.id
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded">
                  OPSi DOC-A4/OFFICIAL
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Dicetak: {formatDateID(new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Document Title Header */}
            <div className="text-center mb-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 underline decoration-emerald-600 underline-offset-4">
                {title}
              </h2>
              {subtitle && <p className="text-[11px] text-slate-600 font-medium mt-1">{subtitle}</p>}
              <div className="flex justify-center items-center space-x-4 mt-2 text-[10px] text-slate-500">
                <span><strong>Area Penugasan:</strong> {areaNama}</span>
                <span>•</span>
                <span><strong>Periode:</strong> {periode}</span>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 px-2.5 py-2 text-center w-8">No</th>
                    {headers.map((h, idx) => (
                      <th key={idx} className="border border-slate-300 px-2.5 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length + 1} className="text-center py-6 text-slate-400 italic">
                        Tidak ada data rekaman operasional untuk ditampilkan
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="border border-slate-300 px-2.5 py-1.5 text-center font-medium text-slate-500">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="border border-slate-300 px-2.5 py-1.5 text-slate-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {footerNotes && (
              <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600">
                <span className="font-semibold text-slate-700">Catatan Operasional: </span>
                {footerNotes}
              </div>
            )}

            {/* Signature Blocks Standard Corporate */}
            <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-[10px]">
              <div>
                <p className="text-slate-500 font-medium">Dibuat Oleh:</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[9px] text-slate-400 italic font-mono">[Tanda Tangan Digital]</span>
                </div>
                <p className="font-bold text-slate-800 border-t border-slate-400 pt-1 mt-1">{preparedBy}</p>
                <p className="text-slate-500 text-[9px]">Staff / Penginput Lapangan</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Diperiksa Oleh:</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[9px] text-slate-400 italic font-mono">[Tanda Tangan Digital]</span>
                </div>
                <p className="font-bold text-slate-800 border-t border-slate-400 pt-1 mt-1">{checkedBy}</p>
                <p className="text-slate-500 text-[9px]">Supervisor / Area Koordinator</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Disetujui Oleh:</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[9px] text-slate-400 italic font-mono">[Tanda Tangan Digital]</span>
                </div>
                <p className="font-bold text-slate-800 border-t border-slate-400 pt-1 mt-1">{approvedBy}</p>
                <p className="text-slate-500 text-[9px]">Operasional Manager / Direktur</p>
              </div>
            </div>

            {/* Document Quality Certification Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                <span>Dokumen Resmi Terverifikasi Sistem OPSi - PT. SINERGI Integra Services</span>
              </span>
              <span>Halaman 1 dari 1 (ISO 9001:2015 Cleaning Service Standard)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
