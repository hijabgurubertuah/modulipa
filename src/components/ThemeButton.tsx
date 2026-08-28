import React from 'react';
import { Theme } from '../types';

interface ThemeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme: Theme;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({ 
  theme, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  children,
  style,
  ...props 
}) => {
  const baseStyles = 'rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm md:text-base',
    lg: 'px-8 py-4 text-base md:text-lg',
    xl: 'px-10 py-5 text-lg md:text-xl'
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          className: 'text-white shadow-lg hover:brightness-110',
          style: { 
            background: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), ${theme.accent}`,
            backgroundColor: theme.accent 
          }
        };
      case 'secondary':
        return {
          className: 'bg-white shadow-md',
          style: { color: theme.accent }
        };
      case 'outline':
        return {
          className: 'bg-transparent border-2 shadow-none',
          style: { borderColor: theme.accent, color: theme.accent }
        };
      case 'ghost':
        return {
          className: 'bg-slate-100 text-slate-600 shadow-none hover:bg-slate-200',
          style: {}
        };
      default:
        return { className: '', style: {} };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${variantStyles.className} ${props.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
      style={{ ...variantStyles.style, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};
