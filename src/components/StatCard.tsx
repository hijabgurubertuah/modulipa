import React from 'react';
import { Theme } from '../types';

interface StatCardProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  theme: Theme;
  onClick?: () => void;
}

export const StatCard = ({ icon, label, value, theme, onClick }: StatCardProps) => (
  <div 
    onClick={onClick}
    className={`bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-lg shadow-black/5 flex items-center gap-4 transition-all ${onClick ? 'cursor-pointer hover:scale-105 hover:bg-white/60 active:scale-95' : ''}`}
  >
    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md border border-white shrink-0">
      {React.cloneElement(icon, { size: 24 } as any)}
    </div>
    <div>
      <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xl font-black tracking-tight">{value}</p>
    </div>
  </div>
);
