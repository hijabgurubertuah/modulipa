import React from 'react';
import { ModuleBase } from './ModuleBase';
import { modul6Service } from '../services/modul6';
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

export const Modul6: React.FC<ModulProps> = (props) => (
  <ModuleBase {...props} service={modul6Service} />
);
