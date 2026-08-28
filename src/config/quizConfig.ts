export interface Question {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation?: string;
}

export interface QuizModuleConfig {
  title: string;
  formId?: string;
  entryMapping?: {
    name: string;
    userClass: string;
    quizName: string;
    score: string;
    date?: string;
  };
  questions: Question[];
}

// All quiz questions are now managed dynamically via Firestore and Admin Dashboard
export const QUIZ_MODULE_CONFIGS: Record<number, QuizModuleConfig> = {};
