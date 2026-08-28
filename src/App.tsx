import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { 
  Menu, 
  X, 
  Home as HomeIcon, 
  BookOpen, 
  Trophy, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  Info,
  Palette,
  ArrowLeft,
  RotateCw,
  Award,
  BarChart3,
  User,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import { Material, Theme, UserProgress } from './types';
import { THEME_PRESETS, ALL_MATERIALS } from './constants';
import { IconComponent } from './components/IconComponent';
import { SidebarItem } from './components/SidebarItem';
import { StatCard } from './components/StatCard';
import { Dialog } from './components/Dialog';
import { ColorInput } from './components/ColorInput';
import { Login } from './components/Login';
import { ThemeButton } from './components/ThemeButton';
import { Home } from './components/Home';
import { Hasil } from './components/Hasil';
import { homeService } from './services/home';
import { GardenDecorations } from './components/GardenDecorations';
import { ModuleBase } from './components/ModuleBase';
import { VideoPlayer } from './components/VideoPlayer';
import { googleFormService } from './services/googleFormService';
import { Rekap } from './components/Rekap';
import { AdminDashboard } from './components/AdminDashboard';
import { firestoreService } from './services/firestoreService';
import { AppModule, AppSettings } from './types';
import { DEFAULT_SETTINGS, getDefaultModules } from './services/defaultData';
import { normalizeImageUrl } from './utils/imageUrlHelper';

const App = () => {
  // --- State ---
  const [username, setUsername] = useState<string>('');
  const [userClass, setUserClass] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'home' | 'material' | 'quiz' | 'resume' | 'modul' | 'rekap' | 'admin'>('home');
  const [activeModule, setActiveModule] = useState<number>(1);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [unlockedModules, setUnlockedModules] = useState<Set<number>>(new Set());
  const [showPasswordModal, setShowPasswordModal] = useState<number | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>(THEME_PRESETS[0]);
  const [showThemeEditor, setShowThemeEditor] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [modules, setModules] = useState<AppModule[]>(() => getDefaultModules());
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    firestoreService.getSettings().then(st => {
      if (isMounted && st) {
        setSettings(st);
      }
    }).catch(err => console.error('Error fetching settings in App:', err));
    return () => { isMounted = false; };
  }, [isLoggedIn, currentView]);

  useEffect(() => {
    let isMounted = true;
    firestoreService.getModules().then(mods => {
      if (isMounted) {
        setModules(mods);
      }
    }).catch(err => console.error('Error fetching modules:', err));
    return () => { isMounted = false; };
  }, [isLoggedIn, currentView]);
  
  // Progress State
  const [progress, setProgress] = useState<UserProgress>({
    completedMaterials: [],
    isIntroductionCompleted: false,
    highScores: {},
    quizHistory: [],
    username: ''
  });

  // Quiz State
  const [quizState, setQuizState] = useState<{
    currentQuestionIndex: number;
    score: number;
    answers: Record<number, string>;
    showResult: boolean;
    feedback: { questionId: number; isCorrect: boolean } | null;
  }>({
    currentQuestionIndex: 0,
    score: 0,
    answers: {},
    showResult: false,
    feedback: null
  });

  // --- Effects ---
  useEffect(() => {
    const savedUser = homeService.getUser();
    const savedClass = localStorage.getItem('ipa_user_class');
    const savedIsLoggedIn = localStorage.getItem('ipa_is_logged_in') === 'true';
    const savedProgress = homeService.getProgress();
    const savedTheme = localStorage.getItem('ipa_theme');
    const savedView = localStorage.getItem('ipa_current_view');
    const savedActiveModule = localStorage.getItem('ipa_active_module');
    const savedMaterialId = localStorage.getItem('ipa_selected_material_id');
    const savedIsTeacher = localStorage.getItem('ipa_is_teacher') === 'true';

    if (savedIsTeacher || savedUser?.toLowerCase() === 'gurusmp' || savedClass?.toLowerCase() === 'guru') {
      setIsTeacherMode(true);
    }

    if (savedUser) {
      setUsername(savedUser);
      if (savedClass) setUserClass(savedClass);
      if (savedIsLoggedIn) {
        setIsLoggedIn(true);
      }
    }
    if (savedProgress) {
      setProgress(savedProgress);
    }
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        if (parsed.name === 'Grape') {
          setTheme(THEME_PRESETS[0]);
        } else {
          setTheme(parsed);
        }
      } catch (e) {
        setTheme(THEME_PRESETS[0]);
      }
    }
    if (savedView) {
      setCurrentView(savedView as any);
    }
    if (savedActiveModule) {
      setActiveModule(parseInt(savedActiveModule, 10));
    }
    if (savedMaterialId) {
      setSelectedMaterialId(savedMaterialId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ipa_active_module', activeModule.toString());
  }, [activeModule]);

  useEffect(() => {
    if (isLoggedIn) {
      homeService.saveUser(username);
      localStorage.setItem('ipa_user_class', userClass);
    }
  }, [isLoggedIn, username, userClass]);

  useEffect(() => {
    homeService.saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('ipa_theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ipa_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedMaterialId) {
      localStorage.setItem('ipa_selected_material_id', selectedMaterialId);
    } else {
      localStorage.removeItem('ipa_selected_material_id');
    }
  }, [selectedMaterialId]);

  useEffect(() => {
    const savedUnlocked = localStorage.getItem('ipa_unlocked_modules');
    if (savedUnlocked) {
      setUnlockedModules(new Set(JSON.parse(savedUnlocked)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ipa_unlocked_modules', JSON.stringify(Array.from(unlockedModules)));
  }, [unlockedModules]);

  // --- Derived Data ---
  const isTeacher = username.toLowerCase() === 'gurusmp';
  const modulePasswords: Record<number, string> = {
    2: '121212',
    3: '133133',
    4: '121212',
    5: '121212',
    6: '121212',
    7: '121212',
    8: '121212',
  };

  const selectedMaterial = useMemo(() => 
    ALL_MATERIALS.find(m => m.id === selectedMaterialId) || null
  , [selectedMaterialId]);

  const totalProgressPercent = useMemo(() => {
    if (ALL_MATERIALS.length === 0) return 0;
    return Math.round((progress.completedMaterials.length / ALL_MATERIALS.length) * 100);
  }, [progress.completedMaterials]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUsername = username.trim();
    const currentClass = userClass.trim();

    // Teacher mode bypass - DOES NOT require choosing a student class
    if (currentUsername.toLowerCase() === 'gurusmp' || currentClass.toLowerCase() === 'guru') {
      setIsTeacherMode(true);
      setUserClass('guru');
      setUsername('GURUSMP');
      localStorage.setItem('ipa_is_teacher', 'true');
      localStorage.setItem('ipa_user', 'GURUSMP');
      localStorage.setItem('ipa_user_class', 'guru');
      localStorage.setItem('ipa_is_logged_in', 'true');
      setIsLoggedIn(true);
      setProgress(prev => ({ ...prev, username: 'GURUSMP' }));
      setCurrentView('home');
      return;
    }

    if (currentUsername && currentClass) {
      const lastUser = localStorage.getItem('ipa_user');
      setIsTeacherMode(false);
      localStorage.removeItem('ipa_is_teacher');

      // If user changed, reset progress
      if (lastUser && lastUser.toUpperCase() !== currentUsername.toUpperCase()) {
        setUnlockedModules(new Set());
        setProgress({
          completedMaterials: [],
          isIntroductionCompleted: false,
          highScores: {},
          quizHistory: [],
          username: currentUsername
        });
        localStorage.removeItem('ipa_unlocked_modules');
        localStorage.removeItem('ipa_progress');
        localStorage.removeItem('ipa_perkenalan_completed_pages');
      }

      setIsLoggedIn(true);
      setProgress(prev => ({ ...prev, username: currentUsername }));
      setCurrentView('home');
      
      // Save for next time
      localStorage.setItem('ipa_user', currentUsername);
      localStorage.setItem('ipa_user_class', currentClass);
      localStorage.setItem('ipa_is_logged_in', 'true');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('home');
    setSelectedMaterialId(null);
    localStorage.removeItem('ipa_current_view');
    localStorage.removeItem('ipa_selected_material_id');
    localStorage.removeItem('ipa_perkenalan_active_page');
    localStorage.setItem('ipa_is_logged_in', 'false');
    // Note: we DO NOT remove ipa_user or ipa_user_class here so they persist on returning to Login screen
    setShowLogoutConfirm(false);
  };

  const selectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    setCurrentView('material');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const startQuiz = () => {
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      answers: {},
      showResult: false,
      feedback: null
    });
    setCurrentView('quiz');
  };

  const submitToRekap = async (materialTitle: string, score: number) => {
    await googleFormService.submitQuizResult(username, userClass, materialTitle, score);
  };

  const handleAnswer = (questionId: number, optionId: string) => {
    if (quizState.feedback) return;

    const currentQuestion = selectedMaterial?.quiz[quizState.currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = optionId === currentQuestion.correctAnswer;
    
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionId },
      feedback: { questionId, isCorrect },
      score: isCorrect ? prev.score + (100 / (selectedMaterial?.quiz.length || 1)) : prev.score
    }));

    // Wait and move to next or finish
    setTimeout(() => {
      if (quizState.currentQuestionIndex < (selectedMaterial?.quiz.length || 0) - 1) {
        setQuizState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          feedback: null
        }));
      } else {
        const finalScore = isCorrect 
          ? quizState.score + (100 / (selectedMaterial?.quiz.length || 1)) 
          : quizState.score;
        
        setQuizState(prev => ({ ...prev, showResult: true, feedback: null }));
        
        // Submit to Google Form Rekap
        if (selectedMaterial) {
          submitToRekap(selectedMaterial.title, Math.round(finalScore));
        }

        // Update Progress
        if (selectedMaterialId) {
          setProgress(prev => {
            const newCompleted = prev.completedMaterials.includes(selectedMaterialId)
              ? prev.completedMaterials
              : [...prev.completedMaterials, selectedMaterialId];
            
            const currentBest = prev.highScores[selectedMaterialId] || 0;
            const newHighScores = {
              ...prev.highScores,
              [selectedMaterialId]: Math.max(currentBest, Math.round(finalScore))
            };

            const newAttempt = {
              materialId: selectedMaterialId,
              score: Math.round(finalScore),
              date: new Date().toLocaleString('id-ID')
            };

            return { 
              ...prev, 
              completedMaterials: newCompleted, 
              highScores: newHighScores,
              quizHistory: [newAttempt, ...(prev.quizHistory || [])]
            };
          });
        }
      }
    }, 1000);
  };

  const shareToWhatsApp = () => {
    if (!selectedMaterial) return;
    const score = progress.highScores[selectedMaterial.id] || 0;
    let status = 'Masih harus belajar lagi';
    if (score === 100 || score >= 90) {
      status = 'Amazing';
    } else if (score >= 80) {
      status = 'Tuntas';
    }

    const text = `*HASIL KUIS IPA SMP - ${selectedMaterial.title.toUpperCase()}*%0A%0A*Nama:* ${username}%0A*Skor:* ${score}/100%0A*Status:* ${status}%0A%0ARajin Pangkal PANDAI..`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const openModule = (num: number) => {
    const targetMod = modules.find(m => m.id === num);
    if (!isTeacher && targetMod && targetMod.isPublished === false) {
      alert('Modul ini belum dibuka atau sedang disembunyikan oleh Guru.');
      return;
    }
    const isProtected = targetMod?.password && !targetMod?.isFreeAccess;
    if (isTeacher || unlockedModules.has(num) || !isProtected) {
      setActiveModule(num);
      setCurrentView('modul');
      setSidebarOpen(false);
    } else {
      setShowPasswordModal(num);
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const handleModuleRedirect = (num: number, pageNum?: number) => {
    if (pageNum !== undefined) {
      localStorage.setItem(`ipa_modul_${num}_active_page`, pageNum.toString());
    }
    openModule(num);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMod = modules.find(m => m.id === showPasswordModal);
    const correctPassword = targetMod?.password || modulePasswords[showPasswordModal || 1];
    if (showPasswordModal && passwordInput === correctPassword) {
      setUnlockedModules(prev => new Set([...Array.from(prev), showPasswordModal]));
      setActiveModule(showPasswordModal);
      setCurrentView('modul');
      setShowPasswordModal(null);
      setSidebarOpen(false);
    } else {
      setPasswordError(true);
    }
  };

  // --- Components ---
  
  // 1. Landing Screen
  if (!isLoggedIn) {
    return (
      <Login 
        username={username} 
        setUsername={setUsername} 
        userClass={userClass}
        setUserClass={setUserClass}
        onLogin={handleLogin} 
        onOpenAdmin={() => {
          setIsLoggedIn(true);
          setCurrentView('admin');
        }}
        settings={settings}
      />
    );
  }

  // 1.5 Dedicated Full-Page Admin Dashboard (Clean Pure White Background, No Garden/Floating Leaf Elements)
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen w-full bg-white text-slate-900 font-sans">
        <AdminDashboard 
          onBackToStudentView={(targetModule?: number) => {
            setIsTeacherMode(true);
            localStorage.setItem('ipa_is_teacher', 'true');
            if (targetModule) {
              setActiveModule(targetModule);
              setCurrentView('modul');
            } else {
              setCurrentView('home');
            }
          }} 
          onLogout={() => {
            setIsLoggedIn(false);
            setIsTeacherMode(false);
            localStorage.removeItem('ipa_is_teacher');
            setUsername('');
            setUserClass('');
            setCurrentView('home');
          }}
        />
      </div>
    );
  }

  // 2. Main App Layout
  return (
    <div 
      className="h-screen flex font-sans transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: theme.bgMain, color: theme.textMain }}
    >
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: (sidebarOpen && currentView !== 'material') ? 0 : -300 }}
        className={`${currentView === 'material' ? 'hidden' : 'fixed md:relative'} w-[230px] h-screen z-50 flex flex-col transition-colors duration-500 shadow-2xl md:shadow-none`}
        style={{ backgroundColor: theme.bgSidebar, color: theme.textSidebar }}
      >
        {/* Sidebar Header */}
        <div className="pt-6 pb-2.5 px-2.5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <motion.button 
              onClick={() => {
                setCurrentView('home');
                setSidebarOpen(false);
              }}
              animate={settings.logoAnimation !== false ? { rotateY: 360 } : { rotateY: 0 }}
              transition={settings.logoAnimation !== false ? { duration: 8, repeat: Infinity, ease: "linear" } : undefined}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            >
              {!logoError ? (
                <img 
                  src={settings.logoUrl || "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png"} 
                  alt={settings.logoTitle || "Logo"} 
                  className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Icons.School size={18} className="text-white/70" />
              )}
            </motion.button>
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-[11px] tracking-tight leading-none uppercase truncate">
                {settings.sidebarTitle || settings.logoTitle || 'Yuk Berkebun'}
              </h2>
              <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mt-0.5 truncate">
                {settings.sidebarSubtitle || settings.logoSubtitle || 'Modul Digital'}
              </p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              title="Tutup Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile and Search Toggle */}
          <div className="flex items-center gap-1.5 mb-2">
            {/* Logo kaca pembesar */}
            <button 
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchQuery('');
                }
              }}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                showSearch || searchQuery 
                  ? 'bg-white/15 text-white shadow-xs' 
                  : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
              title="Cari Materi"
            >
              <Icons.Search size={15} />
            </button>

            {/* Profile (Tombol Nama & Tombol Exit Icon-Only) */}
            <div className="flex-1 min-w-0 flex items-center justify-between px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/5 shadow-inner gap-1.5">
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-xs font-black truncate opacity-95 leading-tight tracking-tight" title={username}>
                  {username || 'Siswa'}
                </span>
                <span className="text-[8px] opacity-50 font-bold uppercase tracking-wider leading-none mt-0.5">
                  Kelas {userClass || '-'}
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setSidebarOpen(false);
                }}
                className="w-7 h-7 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg transition-all shrink-0 flex items-center justify-center shadow-md shadow-rose-900/40"
                title="Keluar Sesi"
                aria-label="Keluar"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Tombol Panel Admin / Guru - HANYA MUNCUL JIKA USERNAME gurusmp */}
          {isTeacher && (
            <button 
              onClick={() => {
                setCurrentView('admin');
                setSidebarOpen(false);
              }}
              className={`w-full mb-1.5 py-2 px-3 rounded-xl flex items-center gap-3 transition-all font-black text-[11px] uppercase tracking-wider relative ${
                currentView === 'admin' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 scale-[1.01]' 
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border border-purple-400/30 hover:shadow-md transition-all active:scale-95'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${currentView === 'admin' ? 'bg-white/20 text-white' : 'bg-purple-500/30 text-purple-200'}`}>
                <Icons.ShieldCheck size={13} />
              </div>
              <span>Panel Admin (Guru)</span>
            </button>
          )}

          {/* Header Quick Menu (Icons Only) */}
          {searchQuery === '1111' && (
            <div className="flex gap-1 mb-1">
              <a 
                href="https://accounts.google.com/SignOutOptions?continue=https://aistudio.google.com/apps/1d64e8db-7e15-4e52-8a3d-96a86eb7f1b2?showAssistant=true"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSidebarOpen(false)}
                className="flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all hover:bg-white/5 opacity-60 hover:opacity-100"
                title="Login Akun"
              >
                <User size={16} />
              </a>
            </div>
          )}

          {/* Search Bar - Toggleable */}
          {showSearch && (
            <div className="relative mb-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Icons.Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari materi..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-2.5 text-[10px] font-bold outline-none focus:border-white/20 transition-all placeholder:opacity-40"
              />
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
          {/* Main Menu */}
          <div className="space-y-0.5">
            <label className="px-3 text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-1.5 block">Modul Belajar</label>
            {(() => {
              const visibleModules = isTeacher ? modules : modules.filter(m => m.isPublished !== false);
              return visibleModules.length > 0 ? (
                visibleModules.map((mod, idx) => {
                  const num = mod.id;
                  const isSelected = currentView === 'modul' && activeModule === num;
                  const isUnlocked = isTeacher || unlockedModules.has(num) || mod.isFreeAccess || !mod.password;
                  const isHidden = mod.isPublished === false;

                  return (
                    <React.Fragment key={num}>
                      <button 
                        onClick={() => openModule(num)}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all ${isSelected ? 'bg-white/20 shadow-lg' : 'hover:bg-white/5 opacity-60 hover:opacity-100'} ${isHidden ? 'border border-amber-400/30' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white text-indigo-600' : 'bg-white/10'}`}>
                          {isSelected ? <Icons.BookOpen size={18} /> : (
                            !isUnlocked ? <Icons.Lock size={14} className="opacity-40" /> : (
                              !logoError ? (
                                <img 
                                  src={normalizeImageUrl(settings.logoUrl) || "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png"} 
                                  alt={settings.logoTitle || "Logo SMP"} 
                                  className="w-5 h-5 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Icons.School size={16} className="opacity-50" />
                              )
                            )
                          )}
                        </div>
                        <div className="flex flex-col items-start truncate">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-bold text-xs uppercase tracking-wider truncate">{mod.title || `MODUL ${num}`}</span>
                            {isTeacher && isHidden && (
                              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded text-[8px] font-bold shrink-0">
                                Sembunyi
                              </span>
                            )}
                          </div>
                          {isTeacher && mod.password && (
                            <span className="text-[10px] opacity-80 font-mono text-amber-400">pass : {mod.password}</span>
                          )}
                        </div>
                      </button>
                      {idx < visibleModules.length - 1 && (
                        <div className="mx-6 my-0.5">
                          <div 
                            className="h-[2px] w-full bg-white/30" 
                            style={{ clipPath: 'polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%)' }} 
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="px-3 py-3 text-center bg-white/5 rounded-xl border border-white/10 text-[11px] text-white/60">
                  {isTeacher 
                    ? 'Belum ada modul. Guru dapat membuat materi baru di Panel Admin.' 
                    : 'Belum ada modul yang dibuka oleh Guru.'}
                </div>
              );
            })()}
            <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
          </div>

          {/* Materials - Hidden as per request to remove specific items which were the only ones */}
          {ALL_MATERIALS.length > 0 && (
            <div className="space-y-1">
              <label className="px-3 text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-1.5 block">Materi Belajar</label>
              {ALL_MATERIALS
                .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((m, index) => {
                const isUnlocked = progress.isIntroductionCompleted && (
                  index === 0 || progress.completedMaterials.includes(ALL_MATERIALS[index - 1].id)
                );

                return (
                  <React.Fragment key={m.id}>
                    <SidebarItem 
                      icon={<IconComponent name={m.icon} size={16} />} 
                      label={m.title} 
                      active={selectedMaterialId === m.id && (currentView === 'material' || currentView === 'quiz')} 
                      onClick={() => {
                        selectMaterial(m.id);
                        setSidebarOpen(false);
                      }}
                      theme={theme}
                      indicator={progress.completedMaterials.includes(m.id)}
                      disabled={!isUnlocked}
                    />
                    {index < ALL_MATERIALS.length - 1 && (
                      <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer (Prominent) */}
        <div className="border-t border-white/10 px-3 py-4 pb-12">
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setShowThemeEditor(true);
                setSidebarOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-black uppercase tracking-wider opacity-80 hover:opacity-100"
              title="Editor Tema"
            >
              <Palette size={14} />
              <span>Tema</span>
            </button>
            <button 
              onClick={() => {
                setShowAbout(true);
                setSidebarOpen(false);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all opacity-60 hover:opacity-100"
              title="Tentang Aplikasi"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Floating Menu Trigger */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 w-[30px] h-[150px] bg-black/30 backdrop-blur-md rounded-r-2xl border border-l-0 border-white/10 flex items-center justify-center z-[60] hover:bg-black/40 transition-all group shadow-[10px_0_30px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {!logoError ? (
              <motion.img 
                src={settings.logoUrl || "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png"} 
                alt="Logo"
                animate={settings.logoAnimation !== false ? { rotateY: 360 } : { rotateY: 0 }}
                transition={settings.logoAnimation !== false ? { duration: 4, repeat: Infinity, ease: "linear" } : undefined}
                className="w-7 h-7 object-contain opacity-90 group-hover:opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Icons.School size={16} className="text-white/60 group-hover:text-white/90 transition-colors" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative flex flex-col leaf-pattern">
        <GardenDecorations />
        
        {/* Content View */}
        <div className={`flex-1 ${currentView === 'material' || currentView === 'modul' ? 'p-3 md:p-6' : 'p-4 md:p-6'} max-w-5xl mx-auto w-full relative z-10 flex flex-col`}>
          <AnimatePresence mode="wait">
            {currentView === 'modul' && (
              <motion.div
                key={`modul-${activeModule}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {!isTeacher && modules.find(m => m.id === activeModule)?.isPublished === false ? (
                  <div className="bg-black/30 backdrop-blur-md border border-white/15 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto my-12 text-white shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center border border-amber-400/30">
                      <Icons.Lock size={28} />
                    </div>
                    <h3 className="text-lg font-bold">Modul Belum Dibuka</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Modul ini sedang disembunyikan atau belum dibuka oleh Guru untuk siswa.
                    </p>
                    <button
                      onClick={() => {
                        const firstVisible = modules.find(m => m.isPublished !== false);
                        if (firstVisible) {
                          setActiveModule(firstVisible.id);
                        } else {
                          setCurrentView('home');
                        }
                      }}
                      className="px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Buka Modul Yang Tersedia
                    </button>
                  </div>
                ) : (
                  <ModuleBase 
                    theme={theme} 
                    username={username}
                    userClass={userClass}
                    searchQuery={searchQuery}
                    moduleNumber={activeModule}
                    onRedirect={handleModuleRedirect}
                    onComplete={() => {
                      setProgress(prev => ({ ...prev, isIntroductionCompleted: true }));
                      setCurrentView('home');
                    }}
                  />
                )}
              </motion.div>
            )}

            {currentView === 'home' && (
              <div className="flex-1 flex items-center justify-center h-full">
                <Home 
                  username={username} 
                  userClass={userClass}
                  settings={settings}
                  setSidebarOpen={setSidebarOpen} 
                  onOpenThemeEditor={() => setShowThemeEditor(true)}
                  onLogout={() => setShowLogoutConfirm(true)}
                  isTeacher={isTeacher}
                  onOpenAdmin={isTeacher ? () => setCurrentView('admin') : undefined}
                />
              </div>
            )}

            {currentView === 'material' && selectedMaterial && (
              <motion.div 
                key="material"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-12 relative z-10 bg-black/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-xl"
              >
                {selectedMaterial.videoUrl && (
                  <VideoPlayer url={selectedMaterial.videoUrl} title={selectedMaterial.title} />
                )}

                <div className="prose prose-invert prose-slate max-w-none">
                  <h1 className="text-3xl font-black tracking-tight mb-4">{selectedMaterial.title}</h1>
                  {!selectedMaterial.Component && (
                    <div className="text-lg leading-relaxed opacity-90 whitespace-pre-line mb-8">
                      {selectedMaterial.content}
                    </div>
                  )}
                  {selectedMaterial.Component && <selectedMaterial.Component />}
                </div>

                {/* Start Quiz Button at the bottom */}
                <div className="pt-8 border-t border-white/10 flex justify-center">
                  <ThemeButton 
                    theme={theme}
                    onClick={startQuiz}
                    size="xl"
                    className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-green-600 shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)]"
                  >
                    <Icons.Zap size={24} className="animate-pulse" />
                    <span>Mulai Kuis Sekarang</span>
                    <Icons.ChevronRight size={24} />
                  </ThemeButton>
                </div>
              </motion.div>
            )}

            {currentView === 'quiz' && selectedMaterial && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-2xl mx-auto w-full py-10 bg-black/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 shadow-xl"
              >
                {!quizState.showResult ? (
                  <div className="space-y-8">
                    <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((quizState.currentQuestionIndex + 1) / selectedMaterial.quiz.length) * 100}%` }}
                      />
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white">
                      <div className="mb-4 text-center">
                        <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">
                          Soal {quizState.currentQuestionIndex + 1} / {selectedMaterial.quiz.length}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-tight text-center">
                        {selectedMaterial.quiz[quizState.currentQuestionIndex].text}
                      </h2>

                      <div className="space-y-3">
                        {selectedMaterial.quiz[quizState.currentQuestionIndex].options.map((opt) => {
                          const isSelected = quizState.answers[selectedMaterial.quiz[quizState.currentQuestionIndex].id] === opt.id;
                          const isFeedback = quizState.feedback?.questionId === selectedMaterial.quiz[quizState.currentQuestionIndex].id;
                          const isCorrect = opt.id === selectedMaterial.quiz[quizState.currentQuestionIndex].correctAnswer;

                          let btnClass = "w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group ";
                          
                          if (isFeedback) {
                            if (isCorrect) btnClass += "bg-emerald-50 border-emerald-500 text-emerald-700 ";
                            else if (isSelected) btnClass += "bg-rose-50 border-rose-500 text-rose-700 ";
                            else btnClass += "bg-slate-50 border-slate-100 text-slate-400 ";
                          } else {
                            btnClass += "bg-slate-50 border-transparent text-slate-700 hover:border-indigo-500 hover:bg-white ";
                          }

                          return (
                            <button 
                              key={opt.id}
                              disabled={!!quizState.feedback}
                              onClick={() => handleAnswer(selectedMaterial.quiz[quizState.currentQuestionIndex].id, opt.id)}
                              className={btnClass}
                            >
                              <span>{opt.text}</span>
                              {isFeedback && isCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                              {isFeedback && isSelected && !isCorrect && <X size={20} className="text-rose-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-indigo-100 border border-indigo-50 text-center space-y-8"
                  >
                    <div className="relative inline-block">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200"
                      >
                        <Trophy size={64} />
                      </motion.div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg"
                      >
                        <Award size={24} />
                      </motion.div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-black text-slate-800 mb-2">Kuis Selesai!</h2>
                      <p className="text-slate-500 font-medium">Kamu telah menyelesaikan materi {selectedMaterial.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skor Kamu</div>
                        <div className="text-3xl font-black text-indigo-600">{Math.round(quizState.score)}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terbaik</div>
                        <div className="text-3xl font-black text-emerald-600">{progress.highScores[selectedMaterial.id] || 0}</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <ThemeButton 
                        theme={theme}
                        variant="secondary"
                        onClick={() => setCurrentView('material')}
                        className="flex-1 py-4"
                      >
                        Kembali ke Materi
                      </ThemeButton>
                      <ThemeButton 
                        theme={theme}
                        onClick={shareToWhatsApp}
                        className="flex-1 py-4 bg-emerald-600 shadow-lg shadow-emerald-100"
                      >
                        Kirim Nilai ke Guru
                      </ThemeButton>
                    </div>
                    <ThemeButton 
                      theme={theme}
                      variant="ghost"
                      onClick={startQuiz}
                      fullWidth
                    >
                      <RotateCw size={16} /> Coba Lagi
                    </ThemeButton>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentView === 'resume' && (
              <motion.div 
                key="resume"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative z-10"
              >
                <Hasil 
                  progress={progress} 
                  allMaterials={ALL_MATERIALS} 
                  theme={theme}
                  onSelectMaterial={selectMaterial}
                  onStartQuiz={(id) => {
                    setSelectedMaterialId(id);
                    startQuiz();
                  }}
                />
              </motion.div>
            )}

            {currentView === 'rekap' && (
              <motion.div 
                key="rekap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative z-10 w-full"
              >
                <Rekap onBack={() => setCurrentView('home')} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Dialogs --- */}

      {/* Password Modal */}
      <Dialog 
        show={showPasswordModal !== null} 
        onClose={() => setShowPasswordModal(null)} 
        title={`Buka Modul ${showPasswordModal}`}
        icon={<Icons.Lock size={24} className="text-white" />}
        maxWidth="max-w-xs"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <p className="text-white/60 text-sm text-center">Masukkan password untuk mengakses Modul {showPasswordModal}</p>
          <div className="relative">
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              autoFocus
              placeholder="Password"
              className={`w-full bg-white/10 border ${passwordError ? 'border-red-500' : 'border-white/20'} rounded-2xl py-3 px-4 text-white text-center font-bold tracking-widest outline-none focus:border-white/40 transition-all`}
            />
            {passwordError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-[10px] font-bold mt-2 text-center"
              >
                Password salah! Silakan coba lagi.
              </motion.p>
            )}
          </div>
          <button 
            type="submit"
            className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black shadow-lg hover:bg-white/90 transition-all active:scale-95"
          >
            BUKA SEKARANG
          </button>
        </form>
      </Dialog>

      {/* Theme Editor */}
      <Dialog 
        show={showThemeEditor} 
        onClose={() => setShowThemeEditor(false)} 
        title="PILIH WARNA"
        icon={<Palette size={24} className="text-white" />}
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          {/* Preset Colors */}
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2">
              {[
                { name: 'Hutan', color: '#033003', accent: '#4ade80' },
                { name: 'Grape', color: '#410052', accent: '#d8b4fe' },
                { name: 'Indigo', color: '#1e1b4b', accent: '#818cf8' },
                { name: 'Rose', color: '#4c0519', accent: '#fb7185' },
                { name: 'Hitam', color: '#000000', accent: '#ffffff' },
                { name: 'Wood', color: '#4f2600', accent: '#fcd34d' }
              ].map(p => (
                <button 
                  key={p.name}
                  onClick={() => {
                    const darken = (hex: string, amount: number) => {
                      let r = parseInt(hex.substring(1, 3), 16);
                      let g = parseInt(hex.substring(3, 5), 16);
                      let b = parseInt(hex.substring(5, 7), 16);
                      r = Math.max(0, Math.floor(r * (1 - amount)));
                      g = Math.max(0, Math.floor(g * (1 - amount)));
                      b = Math.max(0, Math.floor(b * (1 - amount)));
                      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    };
                    const sidebarColor = darken(p.color, 0.3);

                    setTheme({
                      name: 'Custom',
                      bgMain: p.color,
                      bgSidebar: sidebarColor,
                      accent: p.accent,
                      textMain: '#ffffff',
                      textSidebar: '#ffffff',
                      isDark: true
                    });
                  }} 
                  className={`h-14 rounded-xl border-2 transition-all group relative overflow-hidden flex items-center justify-center ${theme.bgMain === p.color ? 'border-white ring-4 ring-white/20 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {theme.bgMain === p.color && <Icons.Check size={16} className="text-white relative z-10" />}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Control */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Warna Kustom</span>
                </div>
                <ColorInput 
                  label="" 
                  value={theme.bgMain} 
                  onChange={(v) => {
                    const darken = (hex: string, amount: number) => {
                      let r = parseInt(hex.substring(1, 3), 16);
                      let g = parseInt(hex.substring(3, 5), 16);
                      let b = parseInt(hex.substring(5, 7), 16);
                      r = Math.max(0, Math.floor(r * (1 - amount)));
                      g = Math.max(0, Math.floor(g * (1 - amount)));
                      b = Math.max(0, Math.floor(b * (1 - amount)));
                      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    };

                    const sidebarColor = darken(v, 0.3);

                    setTheme({
                      ...theme, 
                      bgMain: v, 
                      bgSidebar: sidebarColor, 
                      accent: v === '#000000' ? '#ffffff' : '#ffffff',
                      textMain: '#ffffff',
                      textSidebar: '#ffffff',
                      name: 'Custom'
                    });
                  }} 
                />
              </div>
            </div>
          </div>

          <p className="text-[9px] text-white/30 font-medium text-center italic">
            Warna utama dan teks akan menyesuaikan secara otomatis untuk kenyamanan Anda.
          </p>
        </div>
      </Dialog>

      {/* About Dialog */}
      <Dialog 
        show={showAbout} 
        onClose={() => setShowAbout(false)} 
        hideHeader={true}
        maxWidth="max-w-sm"
      >
        <div className="space-y-6 text-center">
          <motion.div 
            animate={{ rotateY: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="flex justify-center"
            style={{ perspective: 1000 }}
          >
            {!logoError ? (
              <img 
                src={normalizeImageUrl(settings.logoUrl) || "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png"} 
                alt={settings.logoTitle || "Logo SMPN 1 Bengkalis"} 
                className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Icons.School size={48} />
              </div>
            )}
          </motion.div>
          
          <div className="space-y-3">
            <p className="font-bold text-white/60 text-xs uppercase tracking-widest">Aplikasi ini dibuat oleh:</p>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">MUSLIM, S.Pd</h3>
              <div className="text-sm font-bold text-white/80 space-y-0.5">
                <p>Guru Mata Pelajaran IPA</p>
                <p>SMPN 1 BENGKALIS RIAU</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Copyright SMPN 1 Bengkalis</p>
          </div>
        </div>
      </Dialog>

      {/* Logout Confirmation */}
      <Dialog 
        show={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        maxWidth="max-w-[320px]"
        hideHeader={true}
        customBg="bg-gradient-to-b from-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-white/10"
      >
        <div className="p-8 text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-rose-500/30 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl rotate-3">
              <Icons.AlertTriangle size={40} className="text-white drop-shadow-lg" />
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            <h3 className="text-xl font-black text-white tracking-tight">Yakin ingin keluar?</h3>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Sesi belajar Anda akan dihentikan dan nama Anda akan dihapus dari perangkat ini.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black shadow-[0_10px_25px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_35px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-wider text-xs"
            >
              Ya, Keluar Sekarang
            </button>
            <button 
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full py-3 text-slate-400 font-bold hover:text-white transition-colors text-xs uppercase tracking-widest"
            >
              Kembali Belajar
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default App;
