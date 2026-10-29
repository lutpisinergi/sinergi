import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  Mail,
  Send,
  X,
  Layers,
} from 'lucide-react';
import {
  UserAccount,
  CustomReportTemplate,
  CustomReportEntry,
} from '../types/index.ts';
import { StorageService } from '../services/storage.ts';
import { formatDateID } from '../utils/calculations.ts';
import { ExportPrintModal } from '../components/modals/ExportPrintModal.tsx';

interface CustomReportViewProps {
  currentUser: UserAccount;
}

export const CustomReportView: React.FC<CustomReportViewProps> = ({ currentUser }) => {
  const [templates, setTemplates] = useState<CustomReportTemplate[]>(
    StorageService.getCustomTemplates()
  );
  const [entries, setEntries] = useState<CustomReportEntry[]>(
    StorageService.getCustomEntries()
  );
  const areas = StorageService.getAreas();

  // Active Template for filling form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const templateEntries = entries.filter((e) => e.templateId === selectedTemplate?.id);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const area = areas[0];
    const newEntry: CustomReportEntry = {
      id: `ENT-${Date.now()}`,
      templateId: selectedTemplate.id,
      templateNama: selectedTemplate.namaLaporan,
      noDokumen: `DOC/CST/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().split('T')[0],
      areaId: area.id,
      areaNama: area.namaArea,
      pelaporNama: currentUser.nama,
      status: 'disetujui',
      dataValues: formData,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    StorageService.saveCustomEntries(updated);
    StorageService.logActivity(
      currentUser,
      'SUBMIT_CUSTOM_REPORT',
      'Laporan Custom',
      `Submit entri form: ${selectedTemplate.namaLaporan}`
    );

    setIsSubmitSuccess(true);
    setFormData({});
    setTimeout(() => setIsSubmitSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
            <span>Formulir & Template Laporan Custom Operasional</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengisian formulir checklist kebersihan toilet, audit K3 peralatan, dan inspeksi mutu yang dikonfigurasi dinamis
          </p>
        </div>

        <button
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Cetak Dokumen A4</span>
        </button>
      </div>

      {/* Template Selector Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 text-xs">
        <span className="font-bold text-slate-700">Pilih Template Formulir:</span>
        <select
          value={selectedTemplateId}
          onChange={(e) => {
            setSelectedTemplateId(e.target.value);
            setFormData({});
          }}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.namaLaporan} — [{tpl.kategori}]
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dynamic Form Renderer */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">{selectedTemplate?.namaLaporan}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{selectedTemplate?.deskripsi}</p>
          </div>

          {isSubmitSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Formulir berhasil tersimpan dan tercatat pada buku rekap!</span>
            </div>
          )}

          <form onSubmit={handleSubmitEntry} className="space-y-4 text-xs">
            {selectedTemplate?.fieldList.map((fld) => (
              <div key={fld.id}>
                <label className="block font-bold text-slate-700 mb-1">
                  {fld.label} {fld.wajib && <span className="text-rose-600">*</span>}:
                </label>

                {fld.tipe === 'select' && (
                  <select
                    value={formData[fld.id] || ''}
                    onChange={(e) => handleFieldChange(fld.id, e.target.value)}
                    required={fld.wajib}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Pilih Nilai Evaluasi --</option>
                    {fld.options?.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {fld.tipe === 'checkbox' && (
                  <label className="flex items-center space-x-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={!!formData[fld.id]}
                      onChange={(e) => handleFieldChange(fld.id, e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-slate-700 font-medium">Kondisi Terpenuhi / Sesuai Standar</span>
                  </label>
                )}

                {fld.tipe === 'text' && (
                  <input
                    type="text"
                    value={formData[fld.id] || ''}
                    onChange={(e) => handleFieldChange(fld.id, e.target.value)}
                    required={fld.wajib}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                )}

                {fld.tipe === 'date' && (
                  <input
                    type="date"
                    value={formData[fld.id] || ''}
                    onChange={(e) => handleFieldChange(fld.id, e.target.value)}
                    required={fld.wajib}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                )}

                {fld.tipe === 'textarea' && (
                  <textarea
                    rows={2}
                    value={formData[fld.id] || ''}
                    onChange={(e) => handleFieldChange(fld.id, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Simpan Formulir Evaluasi</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Rekap Entri Formulir Terisi */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Hasil Checklist Terisi ({templateEntries.length})
            </h3>
            <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded">
              Verified SOP
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {templateEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-xs">
                Belum ada rekaman checklist terisi untuk template ini.
              </div>
            ) : (
              templateEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{entry.noDokumen}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-emerald-100 text-emerald-800">
                      Disetujui
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Oleh: <strong>{entry.pelaporNama}</strong> • {formatDateID(entry.tanggal)}
                  </p>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    {Object.entries(entry.dataValues).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-500 capitalize">{k.replace(/f_/g, '').replace(/_/g, ' ')}:</span>
                        <strong className="text-slate-800">{typeof v === 'boolean' ? (v ? 'Ya (Sesuai)' : 'Tidak') : String(v)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Export Print Modal */}
      <ExportPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={selectedTemplate?.namaLaporan || 'Laporan Custom'}
        subtitle="Divisi Operasional & Housekeeping PT. SINERGI Integra Services"
        areaNama="Semua Area Penugasan Site"
        periode="Oktober 2026"
        headers={['No Dokumen', 'Tanggal', 'Pelapor', 'Status Evaluasi']}
        rows={templateEntries.map((e) => [
          e.noDokumen,
          formatDateID(e.tanggal),
          e.pelaporNama,
          'Memenuhi Standar SOP (Disetujui)',
        ])}
        preparedBy="Staff Operasional Site"
        checkedBy="Supervisor Mutu"
        approvedBy="Operasional Manager"
      />
    </div>
  );
};
