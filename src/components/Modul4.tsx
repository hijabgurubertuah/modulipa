import React from 'react';
import { ModuleBase } from './ModuleBase';
import { modul4Service } from '../services/modul4';
import { Theme } from '../types';

interface ModulProps {
  theme: Theme;
  username: string;
  userClass: string;
  moduleNumber: number;
  searchQuery?: string;
  onComplete: () => void;
  onRedirect?: (moduleNum: number, pageNum?: number) => void;
}

export const Modul4: React.FC<ModulProps> = (props) => (
  <ModuleBase {...props} service={modul4Service} />
);
