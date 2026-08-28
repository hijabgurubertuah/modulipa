import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Trophy, 
  RefreshCw, 
  Zap, 
  Loader2,
  LayoutDashboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { googleFormService } from '../services/googleFormService';
import { sheetService } from '../services/sheetService';
import { QUIZ_MODULE_CONFIGS } from '../config/quizConfig';
import { Theme } from '../types';

import { ThemeButton } from './ThemeButton';

interface Quis2Props {
  theme: Theme;
  username: string;
  userClass: string;
  onComplete: (score: number) => void;
}

export const Quis2: React.FC<Quis2Props> = ({ theme, username, userClass, onComplete }) => {
  const moduleNumber = 2;
  const config = QUIZ_MODULE_CONFIGS[moduleNumber];
  const QUESTIONS = config.questions;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [direction, setDirection] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{success?: boolean, message?: string} | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const isTeacher = username.toLowerCase() === 'gurusmp';

  // Persistence keys
  const KEY_INDEX = `ipa_quis2_currentIndex`;
  const KEY_ANSWERS = `ipa_quis2_answers`;
  const KEY_SHUFFLED = `ipa_quis2_shuffledQuestions`;
  const KEY_SHOW_RESULT = `ipa_quis2_showResult`;

  useEffect(() => {
    if (isTeacher && Object.keys(answers).length === 0) {
      const teacherAnswers: Record<number, string> = {};
      QUESTIONS.forEach(q => {
        teacherAnswers[q.id] = q.correctId;
      });
      setAnswers(teacherAnswers);
    }

    const savedIndex = localStorage.getItem(KEY_INDEX);
    const savedAnswers = localStorage.getItem(KEY_ANSWERS);
    const savedShuffled = localStorage.getItem(KEY_SHUFFLED);
    const savedShowResult = localStorage.getItem(KEY_SHOW_RESULT);

    // If version changed (number of questions), reset to avoid issues with old progress
    if (savedShuffled) {
      try {
        const parsed = JSON.parse(savedShuffled);
        if (parsed.length !== QUESTIONS.length) {
          localStorage.removeItem(KEY_INDEX);
          localStorage.removeItem(KEY_ANSWERS);
          localStorage.removeItem(KEY_SHUFFLED);
          localStorage.removeItem(KEY_SHOW_RESULT);
          
          const shuffled = QUESTIONS.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
          }));
          setShuffledQuestions(shuffled);
          return;
        }
      } catch (e) {}
    }

    if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error("Failed to parse saved answers", e);
      }
    }
    if (savedShowResult) setShowResult(savedShowResult === 'true');
    
    if (savedShuffled) {
      try {
        setShuffledQuestions(JSON.parse(savedShuffled));
      } catch (e) {
        const shuffled = QUESTIONS.map(q => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        }));
        setShuffledQuestions(shuffled);
      }
    } else {
      const shuffled = QUESTIONS.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      }));
      setShuffledQuestions(shuffled);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY_INDEX, currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem(KEY_ANSWERS, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    if (shuffledQuestions.length > 0) {
      localStorage.setItem(KEY_SHUFFLED, JSON.stringify(shuffledQuestions));
    }
  }, [shuffledQuestions]);

  useEffect(() => {
    localStorage.setItem(KEY_SHOW_RESULT, showResult.toString());
  }, [showResult]);

  if (shuffledQuestions.length === 0) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-lg font-black text-slate-800">Menyiapkan Soal Kuis...</p>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const totalQuestions = shuffledQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  const handleAnswer = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    shuffledQuestions.forEach(q => {
      if (answers[q.id] === q.correctId) {
        correct++;
      }
    });
    return correct;
  };

  const handleFinish = async () => {
    const score = calculateScore();
    setShowResult(true);
    
    if (score === totalQuestions) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
    }
  };

  const handleSendToSheet = async () => {
    if (isSubmitting || submitStatus?.success) return;
    
    const score = calculateScore();
    const percentage = Math.round((score / totalQuestions) * 100);
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    const result = await sheetService.submitScore({
      name: username,
      userClass,
      quizName: `Kuis Modul ${moduleNumber}: ${config.title}`,
      moduleNumber,
      score,
      totalQuestions,
      percentage,
      answers
    });
    
    setSubmitStatus(result);
    setIsSubmitting(false);

    if (result.success) {
      setShowSuccessPopup(true);
      localStorage.removeItem(KEY_INDEX);
      localStorage.removeItem(KEY_ANSWERS);
      localStorage.removeItem(KEY_SHUFFLED);
      localStorage.removeItem(KEY_SHOW_RESULT);
    } else {
      // If error, show message in the results screen (already handled by submitStatus)
      console.error("Submission failed:", result.message);
    }
  };

  const score = calculateScore();
  const percentage = Math.round((score / totalQuestions) * 100);

  const getMotivation = () => {
    if (percentage === 100) return { title: "Sempurna!", color: "text-emerald-500", message: "Luar biasa! Kamu memahami materi Modul 2 dengan sangat baik." };
    if (percentage >= 80) return { title: "Hebat!", color: "text-blue-500", message: "Sedikit lagi sempurna! Pertahankan prestasimu." };
    if (percentage >= 60) return { title: "Bagus!", color: "text-amber-500", message: "Kerja bagus! Pelajari lagi beberapa bagian yang sulit." };
    return { title: "Semangat!", color: "text-rose-500", message: "Jangan menyerah! Coba lagi dan kamu pasti bisa." };
  };

  const motivation = getMotivation();

  if (showResult) {
    return (
      <div className="w-full max-w-2xl mx-auto py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-4"
          style={{ borderColor: theme.accent + '30' }}
        >
          <div className="p-8 text-center text-white space-y-2" style={{ backgroundColor: theme.bgSidebar }}>
            <Trophy size={64} className="mx-auto mb-4" style={{ color: theme.accent }} />
            <h2 className="text-3xl font-black">Hasil Kuis</h2>
            <p className="font-bold opacity-80 uppercase tracking-widest text-xs">{username} - {userClass}</p>
          </div>

          <div className="p-10 text-center space-y-8">
            <div className="text-9xl font-black" style={{ color: theme.bgMain }}>
              {percentage}
            </div>

            {/* Tombol kirim nilai tepat di bawah angka nilai */}
            <div className="max-w-xs mx-auto space-y-3">
              {(percentage >= 0 || isTeacher) && !submitStatus && (
                <ThemeButton
                  theme={theme}
                  onClick={handleSendToSheet}
                  disabled={isSubmitting}
                  size="lg"
                  fullWidth
                  style={{ backgroundColor: theme.bgMain, background: theme.bgMain, color: '#ffffff' }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                  <span>{isSubmitting ? 'Mengirim...' : 'KIRIM NILAI'}</span>
                </ThemeButton>
              )}
              
              {submitStatus && (
                <div className={`p-4 rounded-xl font-bold border-2 ${
                  submitStatus.success 
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                  : 'text-rose-600 bg-rose-50 border-rose-100'
                }`}>
                  {submitStatus.message}
                </div>
              )}
            </div>

            {/* Ucapan motivasi barulah di bawahnya */}
            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
              <h3 className="text-2xl font-black mb-3" style={{ color: theme.bgMain }}>{motivation.title}</h3>
              <p className="text-slate-600 font-bold leading-relaxed">{motivation.message}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
              {isTeacher && (
                <ThemeButton
                  theme={theme}
                  variant="secondary"
                  onClick={() => {
                    window.open(`https://docs.google.com/forms/d/e/${config.formId}/viewanalytics`, '_blank');
                  }}
                  fullWidth
                >
                  <LayoutDashboard size={20} />
                  <span>LIHAT REKAP NILAI (GURU)</span>
                </ThemeButton>
              )}

              <ThemeButton 
                theme={theme}
                variant={submitStatus?.success ? "primary" : "ghost"}
                fullWidth
                disabled={!submitStatus?.success}
                className={!submitStatus?.success ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                style={submitStatus?.success ? { backgroundColor: theme.bgMain, background: theme.bgMain, color: '#ffffff' } : {}}
                onClick={() => {
                  window.open('https://s.shopee.co.id/9ALT8cHtu6', '_blank');
                  onComplete(calculateScore());
                }}
              >
                Kembali ke Beranda
              </ThemeButton>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border-2 border-white/60 flex justify-between items-center px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Zap className="text-yellow-500 fill-yellow-500 flex-shrink-0" size={24} />
          <h2 className="font-black text-slate-800 truncate whitespace-nowrap text-sm md:text-base">{config.title}</h2>
        </div>
        <div className="text-xl font-black text-emerald-600">
          {currentIndex + 1}<span className="text-slate-300 text-sm">/{totalQuestions}</span>
        </div>
      </div>

      <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
        <motion.div 
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-emerald-500 rounded-full"
        />
      </div>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 50, opacity: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-2 border-slate-50 space-y-6"
          >
            <h3 className="text-lg md:text-xl font-black text-slate-800 leading-snug text-justify">
              {currentQuestion.question}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option: any) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                return (
                    <ThemeButton
                      key={option.id}
                      theme={theme}
                      variant={isSelected ? 'primary' : 'secondary'}
                      onClick={() => handleAnswer(option.id)}
                      fullWidth
                      className="text-left justify-start px-6"
                      style={isSelected ? { backgroundColor: theme.accent } : { color: '#1e293b', border: '2px solid #f1f5f9' }}
                    >
                      <span className="leading-tight">{option.text}</span>
                    </ThemeButton>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center gap-4">
        <ThemeButton
          theme={theme}
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className={`${currentIndex === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''} flex items-center gap-2`}
          style={currentIndex > 0 
            ? { backgroundColor: theme.bgMain, background: theme.bgMain, color: '#ffffff' } 
            : { color: '#94a3b8', border: '2px solid #e2e8f0', backgroundColor: '#f1f5f9' }
          }
        >
          <ChevronLeft size={16} />
          <span>Sebelumnya</span>
        </ThemeButton>

        {currentIndex === totalQuestions - 1 ? (
          <ThemeButton
            theme={theme}
            onClick={handleFinish}
            disabled={answeredCount < totalQuestions}
            fullWidth
            className="flex-1 flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.bgMain, background: theme.bgMain, color: '#ffffff' }}
          >
            <span>Selesaikan Kuis</span>
            <CheckCircle2 size={16} />
          </ThemeButton>
        ) : (
          <ThemeButton
            theme={theme}
            onClick={nextQuestion}
            fullWidth
            className="flex-1 flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.bgMain, background: theme.bgMain, color: '#ffffff' }}
          >
            <span>Selanjutnya</span>
            <ChevronRight size={16} />
          </ThemeButton>
        )}
      </div>

      {/* Navigation Grid */}
      <div className="bg-white/50 p-6 rounded-3xl border-2 border-white/60">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {shuffledQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-10 rounded-xl font-black text-xs transition-all ${
                currentIndex === idx 
                  ? 'text-white scale-110 shadow-lg' 
                  : answers[q.id] 
                    ? 'bg-emerald-200 text-emerald-700' 
                    : 'bg-white text-slate-400'
              }`}
              style={currentIndex === idx ? { backgroundColor: theme.accent } : {}}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Berhasil!</h3>
                <p className="text-slate-700 font-bold">Nilai sudah terkirim</p>
              </div>
              <ThemeButton 
                theme={theme}
                onClick={() => {
                  setShowSuccessPopup(false);
                  window.open('https://s.shopee.co.id/9ALT8cHtu6', '_blank');
                  onComplete(calculateScore());
                }}
                fullWidth
                style={{ backgroundColor: theme.bgMain, background: theme.bgMain, color: '#ffffff' }}
              >
                Tutup & Selesai
              </ThemeButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
