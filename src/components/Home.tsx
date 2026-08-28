import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { AppSettings } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface HomeProps {
  username: string;
  userClass: string;
  setSidebarOpen: (open: boolean) => void;
  onOpenThemeEditor: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  isTeacher?: boolean;
  settings?: AppSettings;
}

/**
 * Home component for the dashboard screen after login.
 */
export const Home: React.FC<HomeProps> = ({ 
  username, 
  userClass, 
  setSidebarOpen, 
  onOpenThemeEditor, 
  onLogout,
  onOpenAdmin,
  isTeacher,
  settings
}) => {
  const logoUrl = normalizeImageUrl(settings?.logoUrl || "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png");
  const shouldAnimateLogo = settings?.logoAnimation !== false;
  const welcomeTitle = settings?.homeWelcomeTitle || "Selamat Datang di Modul Berkebun SMPN 1 Bengkalis";
  const welcomeSubtitle = settings?.homeWelcomeSubtitle;
  const homeQuote = settings?.homeQuote || '"Janganlah engkau mengucapkan perkataan yang engkau sendiri tidak suka mendengarnya ketika orang lain mengucapkannya kepadamu."';
  const showQuote = settings?.showHomeQuote !== false && homeQuote.trim().length > 0;
  const buttonText = settings?.homeButtonText || "MULAI BELAJAR";
  const copyrightText = settings?.homeCopyright || `Copyright © ${settings?.schoolName || 'SMPN 1 BENGKALIS'}`;
  const showThemeBtn = settings?.showHomeThemeButton !== false;

  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative flex flex-col items-center justify-center h-full min-h-[480px] space-y-5 md:space-y-7 bg-black/20 backdrop-blur-md p-8 md:p-12 pt-4 md:pt-6 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-2xl text-center max-w-2xl w-full mx-auto"
    >
      <motion.div
        animate={shouldAnimateLogo ? { rotateY: 360 } : { rotateY: 0 }}
        transition={shouldAnimateLogo ? { duration: 12, repeat: Infinity, ease: "linear" } : undefined}
        style={{ perspective: 1000 }}
        className="mb-0 -mt-2 md:-mt-4"
      >
        <img 
          src={logoUrl} 
          alt={settings?.logoTitle || "Logo Modul"} 
          className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png";
          }}
        />
      </motion.div>

      <div className="space-y-3 md:space-y-4">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-black tracking-normal leading-relaxed whitespace-pre-line">
          {welcomeTitle}
        </h1>
        {welcomeSubtitle && (
          <p className="text-xs md:text-sm font-semibold opacity-80 max-w-md mx-auto">
            {welcomeSubtitle}
          </p>
        )}
        <div className="space-y-1.5 pt-1">
          <p className="text-sm md:text-lg opacity-90 font-medium">
            Halo, {username}!
          </p>
          <p className="text-xs md:text-sm font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full inline-block">
            {userClass.toUpperCase() === 'TAMU' ? 'Akses: Pengunjung (TAMU)' : `Kelas: ${userClass}`}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 md:gap-6 pt-0">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="group px-8 py-3 md:px-10 md:py-4 bg-white text-[#008db0] rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
        >
          <span>{buttonText}</span>
        </button>
        
        {showQuote && (
          <div className="max-w-xs md:max-w-md mt-1">
            <p className="text-sm md:text-base italic opacity-80 font-semibold leading-relaxed px-4 text-white/90">
              {homeQuote}
            </p>
          </div>
        )}

        <div className="pt-2 md:pt-4 flex flex-col items-center gap-3">
          <div className="flex items-center flex-wrap justify-center gap-2">
            {(isTeacher && onOpenAdmin) && (
              <button 
                onClick={onOpenAdmin}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-[10px] md:text-xs font-black uppercase text-white tracking-widest rounded-xl border border-purple-400/50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Icons.LayoutDashboard size={14} />
                <span>Dashboard Admin (Edit)</span>
              </button>
            )}
            {showThemeBtn && (
              <button 
                onClick={onOpenThemeEditor}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-[10px] md:text-xs font-black uppercase text-slate-950 tracking-widest rounded-xl border border-amber-400 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Icons.Palette size={14} />
                <span>UBAH WARNA</span>
              </button>
            )}
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-[10px] md:text-xs font-black uppercase text-white tracking-widest rounded-xl border border-rose-500 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icons.LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0">
        <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase">
          {copyrightText}
        </p>
      </div>
    </motion.div>
  );
};
