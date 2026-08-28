import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { AppSettings } from '../types';

interface RekapNilaiProps {
  onBack: () => void;
}

export const RekapNilai: React.FC<RekapNilaiProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    firestoreService.getSettings().then(st => {
      setSettings(st);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching settings:', err);
      setLoading(false);
    });
  }, []);

  const spreadsheetUrl = settings?.sheetUrl?.trim() || '';
  
  // Convert to embed URL for iframe
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/edit')) {
      return url.replace(/\/edit.*$/, '/preview');
    }
    if (!url.endsWith('/preview')) {
      return `${url}/preview`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(spreadsheetUrl);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-[2.5rem] border-2 border-white/60 shadow-xl space-y-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Rekap Nilai Siswa
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Hasil pengerjaan kuis siswa tersimpan rapi di Google Spreadsheet.
            </p>
          </div>
          
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] md:text-xs shadow-lg transition-all active:scale-95 shrink-0"
            >
              <span>BUKA SPREADSHEET</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Memuat data spreadsheet...</p>
          </div>
        ) : spreadsheetUrl ? (
          <div className="relative h-[800px] w-full bg-slate-100 rounded-3xl overflow-hidden border-4 border-slate-200/50 shadow-inner">
            <iframe 
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              title="Spreadsheet Rekap Nilai"
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Spreadsheet Terhubung</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan masukkan Link Google Spreadsheet baru Anda di Panel Admin &rarr; Integrasi Google Sheet.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
