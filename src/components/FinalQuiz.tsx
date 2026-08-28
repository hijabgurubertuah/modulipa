import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Trophy, 
  RefreshCw, 
  ArrowRight,
  Star,
  Zap,
  Target,
  Award,
  Loader2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { googleFormService } from '../services/googleFormService';
import { sheetService } from '../services/sheetService';
import { firestoreService } from '../services/firestoreService';
import { getDefaultQuizzes } from '../services/defaultData';
import { Theme, QuizQuestion } from '../types';
import { ThemeButton } from './ThemeButton';

interface FinalQuizProps {
  theme: Theme;
  moduleNumber: number;
  username: string;
  userClass: string;
  onComplete: (score: number) => void;
}

export const FinalQuiz: React.FC<FinalQuizProps> = ({ theme, moduleNumber, username, userClass, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [direction, setDirection] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{success?: boolean, message?: string} | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const isTeacher = username.toLowerCase() === 'gurusmp';

  // Persistence keys
  const KEY_INDEX = `ipa_quiz_mod${moduleNumber}_currentIndex`;
  const KEY_ANSWERS = `ipa_quiz_mod${moduleNumber}_answers`;
  const KEY_SHOW_RESULT = `ipa_quiz_mod${moduleNumber}_showResult`;

  // --- Load Quiz from Firestore dynamically ---
  useEffect(() => {
    let isMounted = true;
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const quizConfig = await firestoreService.getQuizByModule(moduleNumber);
        const resolvedQuestions = (quizConfig && quizConfig.questions && quizConfig.questions.length > 0)
          ? quizConfig.questions
          : (getDefaultQuizzes().find(q => q.moduleNumber === moduleNumber)?.questions || []);

        if (isMounted && resolvedQuestions.length > 0) {
          setQuestions(resolvedQuestions);
          const shuffled = resolvedQuestions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
          }));
          setShuffledQuestions(shuffled);
        } else if (isMounted) {
          setQuestions([]);
          setShuffledQuestions([]);
        }
      } catch (err) {
        console.error('Error fetching quiz from Firestore:', err);
        const fallbackQz = getDefaultQuizzes().find(q => q.moduleNumber === moduleNumber);
        if (isMounted && fallbackQz && fallbackQz.questions) {
          setQuestions(fallbackQz.questions);
          setShuffledQuestions(fallbackQz.questions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
          })));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuiz();
    return () => { isMounted = false; };
  }, [moduleNumber]);

  // --- Persistence & Teacher Auto-Fill ---
  useEffect(() => {
    if (questions.length === 0) return;

    if (isTeacher && Object.keys(answers).length === 0) {
      const teacherAnswers: Record<number, string> = {};
      questions.forEach(q => {
        teacherAnswers[q.id] = q.correctId;
      });
      setAnswers(teacherAnswers);
    }

    const savedIndex = localStorage.getItem(KEY_INDEX);
    const savedAnswers = localStorage.getItem(KEY_ANSWERS);
    const savedShowResult = localStorage.getItem(KEY_SHOW_RESULT);

    if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error("Failed to parse saved answers", e);
      }
    }
    if (savedShowResult) setShowResult(savedShowResult === 'true');
  }, [questions, isTeacher, moduleNumber]);

  useEffect(() => {
    localStorage.setItem(KEY_INDEX, currentIndex.toString());
  }, [currentIndex, KEY_INDEX]);

  useEffect(() => {
    localStorage.setItem(KEY_ANSWERS, JSON.stringify(answers));
  }, [answers, KEY_ANSWERS]);

  useEffect(() => {
    localStorage.setItem(KEY_SHOW_RESULT, showResult.toString());
  }, [showResult, KEY_SHOW_RESULT]);

  if (loading) {
    return (
      <div className="w-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <p className="text-sm font-bold text-white tracking-wide">Memuat soal kuis...</p>
      </div>
    );
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="w-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center space-y-5 bg-black/20 backdrop-blur-md rounded-3xl border border-white/20 text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-white/80" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl font-black">Belum Ada Soal Kuis</h3>
          <p className="text-xs text-white/70 leading-relaxed">
            Bank soal untuk Modul {moduleNumber} belum dikonfigurasi. Guru dapat menambahkan pertanyaan kuis melalui Panel Admin &rarr; Bank Soal & Kuis.
          </p>
        </div>
        <button
          onClick={() => onComplete(100)}
          className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all"
        >
          Selesaikan Modul
        </button>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex] || shuffledQuestions[0];
  const totalQuestions = shuffledQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  // Calculate score
  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctId) {
        correct++;
      }
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const score = calculateScore();

  const handleSelectOption = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    // Clear persistence
    localStorage.removeItem(KEY_INDEX);
    localStorage.removeItem(KEY_ANSWERS);
    localStorage.removeItem(KEY_SHOW_RESULT);

    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setSubmitStatus(null);
    setShowSuccessPopup(false);
    
    // Reshuffle
    const reshuffled = questions.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    setShuffledQuestions(reshuffled);
  };

  const handleFinishAndSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalScore = calculateScore();
      
      // 1. Submit score to Google Sheets & Firestore
      await sheetService.submitScore({
        name: username,
        userClass,
        quizName: `Kuis Modul ${moduleNumber}`,
        moduleNumber,
        score: finalScore,
        totalQuestions,
        percentage: finalScore,
        answers
      });

      // 2. Fallback submit to Google Form
      await googleFormService.submitQuizResult(username, userClass, `Kuis Modul ${moduleNumber}`, finalScore, moduleNumber);

      setSubmitStatus({ success: true, message: 'Nilai kuis berhasil disimpan dan disinkronkan!' });
      setShowSuccessPopup(true);

      // Confetti animation
      if (finalScore >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error submitting quiz score:', error);
      setSubmitStatus({ success: false, message: 'Gagal mengirim nilai secara otomatis, tetapi progres lokal tersimpan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-2">
      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="quiz-in-progress"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Header & Progress Bar */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-300">
                  <Star size={14} className="fill-emerald-300 text-emerald-300" />
                  Kuis Modul {moduleNumber}
                </span>
                <span className="font-mono bg-white/20 px-2.5 py-0.5 rounded-full text-[11px]">
                  Soal {currentIndex + 1} / {totalQuestions}
                </span>
              </div>
              <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 30 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl text-slate-800 space-y-6 border border-slate-100"
            >
              <div className="space-y-2">
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                  Pertanyaan #{currentIndex + 1}
                </span>
                <h3 className="text-base md:text-lg font-bold text-slate-800 leading-snug">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-3.5 md:p-4 rounded-2xl text-xs md:text-sm font-semibold transition-all border flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-500/20' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}>
                        {opt.id}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft size={16} />
                  Sebelumnya
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    disabled={!answers[currentQuestion.id]}
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Selanjutnya
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    disabled={!answers[currentQuestion.id]}
                    onClick={() => setShowResult(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Trophy size={16} />
                    Lihat Hasil
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Result View */
          <motion.div
            key="quiz-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-10 shadow-2xl text-slate-800 text-center space-y-6 border border-slate-100"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Trophy size={40} className="animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                Hasil Kuis Modul {moduleNumber}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                {score >= 80 ? 'Luar Biasa, Hebat Sekali! 🎉' : score >= 60 ? 'Bagus, Kamu Lulus! 👍' : 'Tetap Semangat Belajar! 💪'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {username} ({userClass})
              </p>
            </div>

            {/* Score Ring */}
            <div className="inline-block p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <span className="text-5xl md:text-6xl font-black text-emerald-600 tracking-tight font-mono">
                {score}
              </span>
              <span className="text-xs text-slate-400 font-bold block mt-1">NILAI AKHIR / 100</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={handleRestart}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <RefreshCw size={16} />
                Coba Ulang Kuis
              </button>

              <button
                disabled={isSubmitting || showSuccessPopup}
                onClick={handleFinishAndSubmit}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : showSuccessPopup ? (
                  <>
                    <CheckCircle2 size={16} />
                    Tersimpan
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Kirim & Simpan Nilai
                  </>
                )}
              </button>

              <button
                onClick={() => onComplete(score)}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                Kembali ke Beranda
                <ArrowRight size={16} />
              </button>
            </div>

            {submitStatus && (
              <p className={`text-xs font-bold mt-2 ${submitStatus.success ? 'text-emerald-600' : 'text-amber-600'}`}>
                {submitStatus.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
