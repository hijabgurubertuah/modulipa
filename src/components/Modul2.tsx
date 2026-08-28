import React from 'react';
import { ModuleBase } from './ModuleBase';
import { modul2Service } from '../services/modul2';
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

export const Modul2: React.FC<ModulProps> = (props) => (
  <ModuleBase {...props} service={modul2Service} />
);
