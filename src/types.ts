import React from 'react';

export type QuestionOption = {
  id: string;
  text: string;
  isCorrect?: boolean;
  redirectModule?: number;
  redirectPage?: number;
  customMessage?: string;
};

export type PageQuiz = {
  question: string;
  options: QuestionOption[];
};

export type ModulePage = {
  id: number;
  title: string;
  titleSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  content: string;
  copyablePrompt?: string;
  triggerQuestion?: string;
  videoUrl?: string;
  imageUrl?: string;
  imagePreviewUrl?: string;
  isGame?: boolean;
  gameId?: string;
  gameType?: 'modular_game1' | 'modular_game2' | 'modular_game3' | 'game1' | 'game2' | 'game3' | 'memory' | 'custom_html' | 'custom_tsx' | string;
  gameCode?: string;
  gameInstructions?: string;
  gamePassScore?: number;
  gameIconUrl?: string;
  gameImageUrl?: string;
  gameAssets?: any[];
  gameItems?: GameItemElement[];
  isFinalQuiz?: boolean;
  isSheet?: boolean;
  sheetUrl?: string;
  isForm?: boolean;
  formUrl?: string;
  isDriveFolder?: boolean;
  driveFolderUrl?: string;
  quiz?: PageQuiz;
};

export interface GameItemElement {
  id?: string;
  name: string;
  emoji?: string;
  imageUrl?: string; // Stored in Firebase as compressed base64 data URI or validated URL
  color?: string;
}

export interface GameItem {
  id: string;
  title: string;
  category: string;
  type: 'modular_game1' | 'modular_game2' | 'modular_game3' | 'game1' | 'game2' | 'game3' | 'memory' | 'custom_html' | 'custom_tsx' | string;
  description?: string;
  code?: string;
  instructions?: string;
  passScore?: number;
  thumbnailIcon?: string;
  iconUrl?: string; // Direct game icon stored in Firebase as base64 or URL
  imageUrl?: string; // Direct game banner/cover stored in Firebase as base64 or URL
  items?: GameItemElement[]; // Array of game card/element items stored in Firebase
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AppModule = {
  id: number;
  title: string;
  subtitle: string;
  password?: string;
  icon?: string;
  order: number;
  isPublished: boolean;
  pages: ModulePage[];
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation?: string;
};

export type QuizConfig = {
  moduleNumber: number;
  title: string;
  formId?: string;
  entryMapping?: {
    name: string;
    userClass: string;
    quizName: string;
    score: string;
    date?: string;
  };
  questions: QuizQuestion[];
};

export type ClassItem = {
  id: string;
  name: string;
  isActive: boolean;
  studentCount?: number;
  description?: string;
};

export type StudentItem = {
  id: string;
  name: string;
  userClass: string;
  nisn?: string;
  password?: string;
  pin?: string;
  status: 'Aktif' | 'Non-Aktif';
  lastLogin?: string;
  lastModule?: number;
  completedModules?: number[];
  createdAt?: string;
};

export type ScoreRecord = {
  id: string;
  username: string;
  userClass: string;
  moduleNumber: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  timestamp?: number;
  syncedToSheet?: boolean;
};

export type ActivityLog = {
  id: string;
  username: string;
  userClass: string;
  action: string;
  details: string;
  timestamp: string;
};

export type AppSettings = {
  googleAppsScriptUrl: string;
  sheetId: string;
  sheetUrl?: string;
  adminPassword: string;
  schoolName: string;
  appTitle: string;
  autoSyncToSheet: boolean;
  
  // Custom Logo Settings
  logoUrl?: string;
  logoTitle?: string;
  logoSubtitle?: string;
  logoAnimation?: boolean;

  // Custom Sidebar Settings
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  showAdminButton?: boolean;
  sidebarFooterText?: string;

  // Custom Halaman Utama (Home Page) Settings
  homeWelcomeTitle?: string;
  homeWelcomeSubtitle?: string;
  homeQuote?: string;
  homeButtonText?: string;
  homeCopyright?: string;
  showHomeQuote?: boolean;
  showHomeThemeButton?: boolean;
};

export type Theme = {
  name: string;
  bgMain: string;
  bgSidebar: string;
  accent: string;
  textMain: string;
  textSidebar: string;
  isDark: boolean;
};

export type QuizAttempt = {
  materialId: string;
  score: number;
  date: string;
};

export type UserProgress = {
  completedMaterials: string[];
  isIntroductionCompleted: boolean;
  highScores: Record<string, number>;
  quizHistory: QuizAttempt[];
  username: string;
};

export type Material = {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: string;
  videoUrl?: string;
  quiz?: {
    id: number;
    text: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
  }[];
  Component?: React.ComponentType;
};
