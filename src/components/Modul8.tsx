import React from 'react';
import { ModuleBase } from './ModuleBase';
import { modul8Service } from '../services/modul8';
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

export const Modul8: React.FC<ModulProps> = (props) => (
  <ModuleBase {...props} service={modul8Service} />
);
