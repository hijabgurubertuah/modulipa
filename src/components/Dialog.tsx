import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface DialogProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
  customBg?: string;
}

export const Dialog = ({ 
  show, 
  onClose, 
  title, 
  icon, 
  children, 
  maxWidth = 'max-w-lg',
  hideHeader = false,
  customBg = 'bg-white'
}: DialogProps) => (
  <AnimatePresence>
    {show && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full ${maxWidth} glass-morphism rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20`}
        >
          {!hideHeader && (
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  {icon}
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} className="text-white/60" />
              </button>
            </div>
          )}
          <div className={`${hideHeader ? '' : 'p-8'} bg-gradient-to-br from-white/5 to-transparent`}>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
