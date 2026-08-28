import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ExternalLink, 
  FileSpreadsheet, 
  ClipboardList, 
  AlertCircle,
  Settings
} from 'lucide-react';
import { Theme, AppSettings } from '../types';
import { firestoreService } from '../services/firestoreService';

interface RekapProps {
  onBack: () => void;
  theme: Theme;
}

const darkenColor = (hex: string, amount: number = 0.25) => {
  if (!hex || !hex.startsWith('#')) return hex;
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const Rekap: React.FC<RekapProps> = ({ onBack, theme }) => {
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

  const darkThemeColor = darkenColor(theme.bgMain, 0.25);
  const sheetUrl = settings?.sheetUrl?.trim() || '';
  
  // Convert standard edit/sharing URL to preview embed if possible
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

  const embedUrl = getEmbedUrl(sheetUrl);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-12">
      {/* Header Card */}
      <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border-2 border-white/60 shadow-lg text-left flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100" style={{ color: theme.bgMain }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">
              Rekapitulasi Nilai & Aktivitas Siswa
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Terhubung dengan Google Spreadsheet resmi
            </p>
          </div>
        </div>

        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            style={{
              backgroundColor: theme.bgMain,
              background: `linear-gradient(135deg, ${theme.bgMain}, ${darkThemeColor})`
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Buka di Google Sheets</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {loading ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl border border-white/40 shadow-xl flex flex-col items-center justify-center space-y-3 text-slate-600">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs font-bold">Memuat konfigurasi spreadsheet...</p>
        </div>
      ) : sheetUrl ? (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border-2 border-white/60 shadow-lg overflow-hidden relative">
          <div className="relative h-[700px] w-full bg-slate-50 rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner flex items-center justify-center">
            {/* Loader Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 pointer-events-none z-0">
              <div 
                className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"
                style={{ borderTopColor: theme.bgMain }}
              />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                Memuat Lembar Google Spreadsheet...
              </p>
            </div>

            {/* Embedded Google Sheet */}
            <iframe 
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0 z-10 rounded-xl"
              allowFullScreen
              title="Lembar Rekap Nilai Siswa"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl border-2 border-white/60 shadow-xl text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <FileSpreadsheet size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900">
              Google Spreadsheet Baru Belum Dihubungkan
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Integrasi sheet lama telah dibersihkan. Guru dapat menghubungkan URL Google Spreadsheet baru melalui <strong>Panel Admin &rarr; Integrasi Google Sheet</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
