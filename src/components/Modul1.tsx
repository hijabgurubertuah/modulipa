import React from 'react';
import { ModuleBase } from './ModuleBase';
import { modul1Service } from '../services/modul1';
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

export const Modul1: React.FC<ModulProps> = (props) => (
  <ModuleBase {...props} service={modul1Service} />
);
