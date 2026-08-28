import React from 'react';
import { motion } from 'motion/react';
import { Theme } from '../types';

import { Lock } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  theme: Theme;
  indicator?: boolean;
  disabled?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, theme, indicator, disabled }) => (
  <button 
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all font-bold text-[11px] group relative ${
      active ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 opacity-70 hover:opacity-100'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    <span className={`${active ? 'text-white' : 'opacity-70 group-hover:opacity-100'}`}>{icon}</span>
    <span className="flex-1 text-left truncate">{label}</span>
    {disabled ? (
      <Lock size={10} className="opacity-50" />
    ) : indicator && (
      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
    )}
    {active && !disabled && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
      />
    )}
  </button>
);
