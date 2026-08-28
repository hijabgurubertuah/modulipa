import React from 'react';
import { Copy, Check } from 'lucide-react';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">{label}</label>}
      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 group">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-inner border border-white/20 shrink-0">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Hex Code</span>
          <span className="text-sm font-mono font-black text-white uppercase tracking-wider">{value}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="ml-auto w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95"
          title="Salin Kode Hex"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-white/40 group-hover:text-white" />}
        </button>
      </div>
    </div>
  );
};
