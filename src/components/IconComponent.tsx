import React from 'react';
import * as Icons from 'lucide-react';

export const IconComponent = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const LucideIcon = (Icons as any)[name] || Icons.HelpCircle;
  return <LucideIcon size={size} className={className} />;
};
