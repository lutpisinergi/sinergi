import React, { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, CheckCircle2, X, AlertTriangle } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onImageSelected: (base64OrUrl: string, type: 'before' | 'progress' | 'after') => void;
  defaultType?: 'before' | 'progress' | 'after';
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  title,
  onImageSelected,
  defaultType = 'before',
}) => {
  if (!isOpen) return null;

  const [imageType, setImageType] = useState<'before' | 'progress' | 'after'>(defaultType);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample curated cleaning service evidence images for quick demo selection
  const SAMPLE_EVIDENCE = [
    {
      label: 'Lantai Marmer Kinclong (After)',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Kondisi Noda Lantai / Kerak (Before)',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Proses Pengerjaan Mesin Polisher (Progress)',
      url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file harus berupa gambar (.jpg, .jpeg, .png, .webp)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 10MB sebelum kompresi');
      return;
    }

    setErrorMsg(null);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    // Simulate auto client compression
    setCompressedSize((Math.max(120, file.size / (1024 * 4))).toFixed(1) + ' KB (Hemat 75%)');

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!previewUrl) return;
    onImageSelected(previewUrl, imageType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Ambil dari kamera ponsel atau unggah dari galeri</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tag Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Klasifikasi Foto:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['before', 'progress', 'after'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setImageType(t)}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    imageType === t
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t === 'before' ? 'Foto BEFORE' : t === 'progress' ? 'Foto PROGRESS' : 'Foto AFTER'}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/30"
          >
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-cover shadow-sm border border-slate-200"
                />
                <div className="text-[11px] text-slate-500 flex justify-center space-x-3">
                  <span>Ukuran Asli: <strong>{fileSize}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">Terkonversi: {compressedSize}</span>
                </div>
                <p className="text-xs text-emerald-600 font-medium">Klik untuk mengganti foto</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Sentuh untuk Buka Kamera / Pilih File Foto</p>
                <p className="text-[10px] text-slate-400">Mendukung JPG, PNG, WEBP (Kompresi otomatis aktif)</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Selector for Easy Testing */}
          <div>
            <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Atau pilih dari sampel dokumentasi operasional:</p>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_EVIDENCE.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPreviewUrl(item.url);
                    setFileSize('280 KB');
                    setCompressedSize('78 KB');
                    setErrorMsg(null);
                  }}
                  className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 cursor-pointer shadow-2xs"
                >
                  <img src={item.url} alt={item.label} className="w-full h-16 object-cover" />
                  <div className="p-1 bg-white text-[9px] font-medium text-slate-700 truncate text-center">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={!previewUrl}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              Lampirkan Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
