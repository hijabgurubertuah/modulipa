import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, CheckCircle2, ArrowRight, Lock, ChevronRight, ChevronLeft, Trophy, X, ExternalLink, Copy, BookOpen } from 'lucide-react';
import { Theme, ModulePage } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { FinalQuiz } from './FinalQuiz';
import { Quis1 } from './Quis1';
import { Quis2 } from './Quis2';
import { Quis3 } from './Quis3';
import { Game1 } from './Game1';
import { Game2 } from './Game2';
import { Game3 } from './Game3';
import { MemoryGame } from './MemoryGame';
import { CustomGameRenderer } from './CustomGameRenderer';
import { ThemeButton } from './ThemeButton';
import { firestoreService, hydrateModulePages } from '../services/firestoreService';
import { getDefaultModules } from '../services/defaultData';
import { GAME_TEMPLATES } from '../utils/gameTemplates';

const PRAISES = [
  'Kamu Luar Biasa!',
  'Kamu Keren!',
  'Kamu Mantap!',
  'Kamu Hebat Sekali!',
  'Kamu Terus Berjuang!',
  'Kamu Fantastis!',
  'Kamu Cerdas!',
  'Kamu Brilian!'
];

const darkenColor = (hex: string, amount: number = 0.25) => {
  if (!hex || !hex.startsWith('#')) return hex;
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

type Page = ModulePage;

interface ModuleData {
  title: string;
  pages: Page[];
}

interface ModuleBaseProps {
  theme: Theme;
  username: string;
  userClass: string;
  moduleNumber: number;
  searchQuery?: string;
  onComplete: () => void;
  onRedirect?: (moduleNum: number, pageNum?: number) => void;
  service?: {
    getIntroduction: () => ModuleData;
  };
}

const renderFormattedText = (text?: string) => {
  if (!text) return null;
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1 py-0.5 rounded shadow-sm text-xs sm:text-sm inline mx-0.5 select-all font-sans">
          {part}
        </strong>
      );
    }
    return part;
  });
};

export const ModuleBase: React.FC<ModuleBaseProps> = ({ 
  theme, 
  username, 
  userClass, 
  moduleNumber, 
  searchQuery, 
  onComplete,
  onRedirect,
  service 
}) => {
  const defaultData = React.useMemo(() => {
    if (service) {
      const intro = service.getIntroduction();
      const rawPages = [...(intro.pages || [])] as Page[];
      if (rawPages.length > 0) {
        const hydratedPages = hydrateModulePages(rawPages);
        const contentPages = hydratedPages.filter(p => !p.isFinalQuiz);
        const quizPage: Page = hydratedPages.find(p => p.isFinalQuiz) || {
          id: 99999,
          title: `Kuis & Evaluasi Modul ${moduleNumber}`,
          titleSize: 'lg',
          content: '',
          isFinalQuiz: true
        };
        return { ...intro, pages: [...contentPages, quizPage] };
      }
    }

    const defaultMod = getDefaultModules().find(m => m.id === moduleNumber);
    if (defaultMod && defaultMod.pages && defaultMod.pages.length > 0) {
      const rawPages = hydrateModulePages([...defaultMod.pages]) as Page[];
      const contentPages = rawPages.filter(p => !p.isFinalQuiz);
      const quizPage: Page = rawPages.find(p => p.isFinalQuiz) || {
        id: 99999,
        title: `Kuis & Evaluasi Modul ${moduleNumber}`,
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      };
      return { title: defaultMod.title, pages: [...contentPages, quizPage] };
    }

    return { 
      title: `Modul ${moduleNumber}`, 
      pages: [
        {
          id: 99999,
          title: `Kuis & Evaluasi Modul ${moduleNumber}`,
          titleSize: 'lg',
          content: '',
          isFinalQuiz: true
        }
      ] 
    };
  }, [service, moduleNumber]);

  const [dynamicData, setDynamicData] = useState<ModuleData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadModuleAndGames = async () => {
      try {
        const mod = await firestoreService.getModuleById(moduleNumber);
        if (!isMounted) return;
        if (mod && mod.pages && mod.pages.length > 0) {
          const rawPages = hydrateModulePages(mod.pages);

          // Filter out any intermediate isFinalQuiz to guarantee it is placed on the last page
          const contentPages = rawPages.filter(p => !p.isFinalQuiz);
          const existingQuiz = rawPages.find(p => p.isFinalQuiz);
          const finalQuizPage: Page = existingQuiz || {
            id: rawPages.length > 0 ? Math.max(...rawPages.map((p: any) => p.id)) + 1 : 99999,
            title: `Kuis & Evaluasi Modul ${moduleNumber}`,
            titleSize: 'lg',
            content: '',
            isFinalQuiz: true
          };

          setDynamicData({
            title: mod.title,
            pages: [...contentPages, finalQuizPage]
          });
        }
      } catch (err) {
        console.error("Error loading module from Firestore:", err);
      }
    };

    loadModuleAndGames();
    return () => { isMounted = false; };
  }, [moduleNumber]);

  const data = dynamicData || defaultData;
  const [activePage, setActivePage] = useState(0);
  const isScoreCheckPage = (moduleNumber === 2 || moduleNumber === 3 || moduleNumber === 4) && activePage === 0;
  const [gameLevel, setGameLevel] = useState(1);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [openedPages, setOpenedPages] = useState<number[]>([]);
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizDelay, setQuizDelay] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const quizRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((moduleNumber === 2 || moduleNumber === 3 || moduleNumber === 4) && activePage === 0) {
      setQuizDelay(false);
      setCountdownSeconds(0);
      return;
    }
    const isAlreadyCompleted = completedPages.includes(activePage);
    const isAlreadyOpened = openedPages.includes(activePage);

    if (isAlreadyCompleted || isAlreadyOpened) {
      setQuizDelay(false);
      setCountdownSeconds(0);
    } else {
      setQuizDelay(true);
      const isVideoPage = !!data.pages[activePage]?.videoUrl;
      const totalSeconds = isVideoPage ? 30 : 10;
      setCountdownSeconds(totalSeconds);

      const timer = setTimeout(() => {
        setQuizDelay(false);
        setOpenedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
      }, totalSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [activePage, moduleNumber, completedPages, openedPages, data.pages]);

  useEffect(() => {
    if (countdownSeconds > 0) {
      const timer = setTimeout(() => {
        setCountdownSeconds(prev => {
          const next = prev - 1;
          if (next === 0) {
            setQuizDelay(false);
          }
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownSeconds]);

  useEffect(() => {
    if (quizActive && quizRef.current) {
      setTimeout(() => {
        quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [quizActive]);

  const isTeacher = username.toLowerCase() === 'gurusmp';
  const isUnlockedGlobally = searchQuery === moduleNumber.toString() || isTeacher;

  const [showPopup, setShowPopup] = useState<{ 
    show: boolean; 
    type: 'success' | 'error'; 
    praise?: string;
    message: string;
    hideScore?: boolean;
  }>({
    show: false,
    type: 'success',
    message: '',
    hideScore: false
  });

  // Load persistence
  useEffect(() => {
    const savedActivePage = localStorage.getItem(`ipa_modul_${moduleNumber}_active_page`);
    const savedCompletedPages = localStorage.getItem(`ipa_modul_${moduleNumber}_completed_pages`);
    const savedOpenedPages = localStorage.getItem(`ipa_modul_${moduleNumber}_opened_pages`);

    if (savedActivePage) setActivePage(parseInt(savedActivePage, 10));
    else setActivePage(0);
    
    if (savedCompletedPages) {
      try {
        setCompletedPages(JSON.parse(savedCompletedPages));
      } catch (e) {
        setCompletedPages([]);
      }
    } else {
      setCompletedPages([]);
    }

    if (savedOpenedPages) {
      try {
        setOpenedPages(JSON.parse(savedOpenedPages));
      } catch (e) {
        setOpenedPages([]);
      }
    } else {
      setOpenedPages([]);
    }
    
    setQuizActive(false);
    setQuizSelected(null);
  }, [moduleNumber]);

  // Save persistence
  useEffect(() => {
    localStorage.setItem(`ipa_modul_${moduleNumber}_active_page`, activePage.toString());
  }, [activePage, moduleNumber]);

  useEffect(() => {
    localStorage.setItem(`ipa_modul_${moduleNumber}_completed_pages`, JSON.stringify(completedPages));
  }, [completedPages, moduleNumber]);

  useEffect(() => {
    localStorage.setItem(`ipa_modul_${moduleNumber}_opened_pages`, JSON.stringify(openedPages));
  }, [openedPages, moduleNumber]);

  const handleQuiz = (optionId: string) => {
    setQuizSelected(optionId);
    const currentPage = data.pages[activePage];
    if (!currentPage.quiz) return;

    const option = currentPage.quiz.options.find(o => o.id === optionId);
    
    if (option?.isCorrect) {
      const isSpecificTransition = moduleNumber === 1 && activePage === 0;
      
      // Check for custom message or specific redirection message
      let message = 'Jawabanmu benar! Kamu mendapatkan nilai 100.';
      let praise = isSpecificTransition ? 'AYO MULAI BELAJAR' : PRAISES[Math.floor(Math.random() * PRAISES.length)];
      
      if (option.customMessage) {
        message = option.customMessage;
        praise = 'Perhatian!';
      } else if (option.redirectModule) {
        message = `ayo kita kerjakan modul ${option.redirectModule} terlebih dahulu`;
        praise = 'Mulai Modul Lain';
      }

      setShowPopup({
        show: true,
        type: 'success',
        praise: praise,
        message: message,
        hideScore: !!(option.redirectModule || option.customMessage)
      });
      setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
    } else {
      setShowPopup({
        show: true,
        type: 'error',
        praise: 'Baca lagi!',
        message: 'Coba perhatikan kembali materinya ya.'
      });
      setQuizActive(false);
      setQuizDelay(true);
      setCountdownSeconds(10);
    }
  };

  const handlePopupClick = () => {
    if (showPopup.type === 'success') {
      const currentPage = data.pages[activePage];
      const selectedOption = currentPage.quiz?.options.find(o => o.id === quizSelected);
      
      if (selectedOption?.redirectModule && onRedirect) {
        onRedirect(selectedOption.redirectModule, selectedOption.redirectPage);
        setShowPopup(prev => ({ ...prev, show: false }));
        return;
      }

      if (activePage < data.pages.length - 1) {
        setActivePage(activePage + 1);
        setQuizActive(false);
        setQuizSelected(null);
      } else {
        onComplete();
      }
    }
    setShowPopup(prev => ({ ...prev, show: false }));
  };

  if (!data.pages || data.pages.length === 0) {
    return (
      <div className="max-w-xl mx-auto min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-5 bg-black/20 backdrop-blur-md rounded-3xl border border-white/20 text-white my-8">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-white/80" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl font-black">Modul {moduleNumber} Belum Memiliki Materi</h3>
          <p className="text-xs text-white/70 leading-relaxed">
            Materi pembelajaran belum diisi. Guru dapat menambahkan isi materi, video pembelajaran, dan kuis melalui Panel Admin &rarr; Modul Pembelajaran.
          </p>
        </div>
        <ThemeButton
          theme={theme}
          onClick={onComplete}
          className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
        >
          Kembali ke Beranda
        </ThemeButton>
      </div>
    );
  }

  const currentPage = data.pages[activePage] || data.pages[0];

  // Clean title to avoid "MODUL 2 : Modul 2" duplicates
  const getCleanTitle = () => {
    let clean = data.title;
    const prefixRegex = new RegExp(`^modul\\s*${moduleNumber}\\s*[:\\-]?\\s*`, 'i');
    clean = clean.replace(prefixRegex, '');
    return `MODUL ${moduleNumber} : ${clean}`;
  };

  return (
    <div className="max-w-3xl mx-auto min-h-[80vh] flex flex-col pb-10">
      {/* Navbar Tabs */}
      <div className="flex justify-center w-full gap-1 md:gap-2 mb-2 px-2 py-1.5">
        {data.pages.map((page, index) => {
          const isUnlocked = index === 0 || completedPages.includes(index - 1) || isUnlockedGlobally;
          const isActive = activePage === index;
          const isCompleted = completedPages.includes(index);

          return (
            <motion.button
              key={index}
              layout
              disabled={!isUnlocked}
              onClick={() => {
                setActivePage(index);
                setQuizActive(false);
                setQuizSelected(null);
              }}
              className={`h-10 rounded-lg text-[10px] md:text-xs font-black transition-all flex items-center justify-center gap-1 relative overflow-hidden min-w-0 shadow-sm ${
                isActive 
                  ? 'flex-[2] bg-white text-emerald-600 shadow-xl px-2 z-10' 
                  : isUnlocked 
                    ? 'flex-1 bg-white/30 text-white hover:bg-white/40 shadow-md' 
                    : 'flex-1 bg-black/20 text-white/20 cursor-not-allowed'
              }`}
            >
              {isActive ? (
                <span className="whitespace-nowrap">
                  {page.isFinalQuiz ? 'Kuis Akhir' : page.isGame ? 'Game' : `Hal ${index + 1}`}
                </span>
              ) : (
                <span>{index + 1}</span>
              )}
              {isCompleted && !isActive && <CheckCircle2 size={8} className="absolute top-1 right-1 text-emerald-400" />}
            </motion.button>
          );
        })}
      </div>

      {/* Centered Module Title with Minimal Frame */}
      <div className="flex justify-center mb-3 px-4 animate-in fade-in duration-300">
        <div 
          className="px-5 py-1 rounded-xl border font-black tracking-[0.14em] text-[10px] md:text-xs uppercase text-center flex items-center justify-center gap-2.5 shadow-md backdrop-blur-md text-white"
          style={{ 
            borderColor: `${theme.accent}45`, 
            backgroundColor: `${theme.accent}1c`, 
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse bg-white"></span>
          <span>{getCleanTitle()}</span>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse bg-white"></span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentPage.isFinalQuiz ? (
            <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FinalQuiz 
                theme={theme}
                moduleNumber={moduleNumber}
                username={username} 
                userClass={userClass} 
                onComplete={() => onComplete()}
              />
            </motion.div>
          ) : (currentPage.isGame || (currentPage.gameCode && currentPage.gameCode.trim()) || currentPage.gameId || (currentPage.gameType && currentPage.gameType !== '')) ? (
            <motion.div key={`game_${activePage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {(currentPage.gameCode || currentPage.gameType === 'custom_html' || currentPage.gameType === 'custom_tsx') ? (
                <div className="space-y-6">
                  <CustomGameRenderer
                    code={currentPage.gameCode || (GAME_TEMPLATES.find(t => t.type === currentPage.gameType)?.code || GAME_TEMPLATES[0].code)}
                    gameType={currentPage.gameType || 'custom_html'}
                    title={currentPage.title || 'Game Edukasi Interaktif'}
                    instructions={currentPage.gameInstructions || currentPage.content}
                    assets={currentPage.gameAssets || (currentPage as any).items}
                    onComplete={(score) => {
                      setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                      setShowPopup({
                        show: true,
                        type: 'success',
                        praise: PRAISES[Math.floor(Math.random() * PRAISES.length)],
                        message: score ? `Skor game: ${score} poin! Silakan lanjut ke materi berikutnya.` : 'Luar biasa! Kamu berhasil menyelesaikan tantangan game ini.'
                      });
                    }}
                  />

                  <div className="flex flex-row gap-2 justify-center max-w-[400px] mx-auto">
                    {activePage > 0 && (
                      <ThemeButton 
                        theme={theme}
                        onClick={() => {
                          setActivePage(activePage - 1);
                          setQuizActive(false);
                        }}
                        className="flex-1 px-2 text-sm sm:text-base py-3 cursor-pointer"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Kembali</span>
                      </ThemeButton>
                    )}

                    <ThemeButton
                      theme={theme}
                      disabled={quizDelay}
                      onClick={() => {
                        setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                        if (activePage < data.pages.length - 1) {
                          setActivePage(activePage + 1);
                        } else {
                          onComplete();
                        }
                      }}
                      className="flex-1 px-2 text-sm sm:text-base py-3 cursor-pointer"
                      style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                    >
                      <span className="hidden xs:inline text-white">LANJUT</span>
                      <ChevronRight size={18} className="text-white" />
                    </ThemeButton>
                  </div>
                </div>
              ) : (currentPage.gameType === 'modular_game1' || currentPage.gameType === 'game1' || currentPage.gameId === 'game_1' || (!currentPage.gameType && Number(moduleNumber) === 1)) ? (
                <div className="space-y-6">
                  <Game1 
                    searchQuery={searchQuery}
                    onLevelChange={(lvl) => setGameLevel(lvl)}
                    onGameComplete={(isFullComplete) => {
                      setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                      setShowPopup({
                        show: true,
                        type: 'success',
                        praise: isFullComplete ? 'KAMU TIDAK ADA LAWAN' : PRAISES[Math.floor(Math.random() * PRAISES.length)],
                        message: isFullComplete ? 'Luar biasa, kamu sang legenda!' : ''
                      });
                    }}
                  />
                  
                  <div className="flex flex-row gap-2 justify-center max-w-[400px] mx-auto">
                    {activePage > 0 && (
                      <ThemeButton 
                        theme={theme}
                        onClick={() => {
                          setActivePage(activePage - 1);
                          setQuizActive(false);
                        }}
                        className="flex-1 px-2 text-sm sm:text-base py-3"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Kembali</span>
                      </ThemeButton>
                    )}

                    <ThemeButton
                      theme={theme}
                      disabled={gameLevel < (currentPage.gamePassScore || 4) || quizDelay}
                      onClick={() => {
                        setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                        if (activePage < data.pages.length - 1) {
                          setActivePage(activePage + 1);
                        } else {
                          onComplete();
                        }
                      }}
                      className="flex-1 px-2 text-sm sm:text-base py-3 disabled:opacity-50 disabled:grayscale"
                      style={gameLevel >= (currentPage.gamePassScore || 4) ? { backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' } : {}}
                    >
                      <span className="hidden xs:inline text-white">LANJUT</span>
                      <ChevronRight size={18} className="text-white" />
                    </ThemeButton>
                  </div>
                </div>
              ) : (currentPage.gameType === 'modular_game2' || currentPage.gameType === 'game2' || currentPage.gameId === 'game_2' || (!currentPage.gameType && Number(moduleNumber) === 2)) ? (
                <div className="space-y-6">
                  <Game2 
                    searchQuery={searchQuery}
                    onLevelChange={(lvl) => setGameLevel(lvl)}
                    onGameComplete={(isFullComplete) => {
                      setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                      if (isFullComplete) {
                        setShowPopup({
                          show: true,
                          type: 'success',
                          praise: 'KAMU SANG JUARA',
                          message: 'Luar biasa! Kamu telah menyelesaikan semua level. Ayo lanjut ke halaman berikutnya.'
                        });
                      }
                    }}
                  />
                  
                  <div className="flex flex-row gap-2 justify-center max-w-[400px] mx-auto">
                    {activePage > 0 && (
                      <ThemeButton 
                        theme={theme}
                        onClick={() => {
                          setActivePage(activePage - 1);
                          setQuizActive(false);
                        }}
                        className="flex-1 px-2 text-sm sm:text-base py-3"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Kembali</span>
                      </ThemeButton>
                    )}

                    <ThemeButton
                      theme={theme}
                      disabled={gameLevel < (currentPage.gamePassScore || 4) || quizDelay}
                      onClick={() => {
                        setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                        if (activePage < data.pages.length - 1) {
                          setActivePage(activePage + 1);
                        } else {
                          onComplete();
                        }
                      }}
                      className="flex-1 px-2 text-sm sm:text-base py-3 disabled:opacity-50 disabled:grayscale"
                      style={gameLevel >= (currentPage.gamePassScore || 4) ? { backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' } : {}}
                    >
                      <span className="hidden xs:inline text-white">LANJUT</span>
                      <ChevronRight size={18} className="text-white" />
                    </ThemeButton>
                  </div>
                </div>
              ) : (currentPage.gameType === 'modular_game3' || currentPage.gameType === 'game3' || currentPage.gameId === 'game_3' || (!currentPage.gameType && Number(moduleNumber) === 3)) ? (
                <div className="space-y-6">
                  <Game3 
                    searchQuery={searchQuery}
                    onLevelChange={(lvl) => setGameLevel(lvl)}
                    onGameComplete={(isFullComplete) => {
                      setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                      if (isFullComplete) {
                        setShowPopup({
                          show: true,
                          type: 'success',
                          praise: 'KAMU SANG JUARA',
                          message: 'Luar biasa! Kamu telah menyelesaikan semua level. Ayo lanjut ke halaman berikutnya.'
                        });
                      }
                    }}
                  />
                  
                  <div className="flex flex-row gap-2 justify-center max-w-[400px] mx-auto">
                    {activePage > 0 && (
                      <ThemeButton 
                        theme={theme}
                        onClick={() => {
                          setActivePage(activePage - 1);
                          setQuizActive(false);
                        }}
                        className="flex-1 px-2 text-sm sm:text-base py-3"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Kembali</span>
                      </ThemeButton>
                    )}

                    <ThemeButton
                      theme={theme}
                      disabled={gameLevel < (currentPage.gamePassScore || 4) || quizDelay}
                      onClick={() => {
                        setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                        if (activePage < data.pages.length - 1) {
                          setActivePage(activePage + 1);
                        } else {
                          onComplete();
                        }
                      }}
                      className="flex-1 px-2 text-sm sm:text-base py-3 disabled:opacity-50 disabled:grayscale"
                      style={gameLevel >= (currentPage.gamePassScore || 4) ? { backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' } : {}}
                    >
                      <span className="hidden xs:inline text-white">LANJUT</span>
                      <ChevronRight size={18} className="text-white" />
                    </ThemeButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <MemoryGame 
                    items={currentPage.gameAssets || (currentPage as any).items}
                    onLevelComplete={() => {
                      setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                    }} 
                  />
                  <div className="flex flex-row gap-2 justify-center max-w-[400px] mx-auto">
                    {activePage > 0 && (
                      <ThemeButton 
                        theme={theme}
                        onClick={() => {
                          setActivePage(activePage - 1);
                          setQuizActive(false);
                        }}
                        className="flex-1 px-2 text-sm sm:text-base py-3"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Kembali</span>
                      </ThemeButton>
                    )}

                    <ThemeButton 
                      theme={theme}
                      disabled={quizDelay}
                      onClick={() => {
                        setCompletedPages(prev => prev.includes(activePage) ? prev : [...prev, activePage]);
                        setShowPopup({
                          show: true,
                          type: 'success',
                          praise: PRAISES[Math.floor(Math.random() * PRAISES.length)],
                          message: 'Luar biasa, permainan memori berhasil diselesaikan!'
                        });
                        if (activePage < data.pages.length - 1) {
                          setActivePage(activePage + 1);
                        } else {
                          onComplete();
                        }
                      }}
                      className="flex-1 px-2 text-sm sm:text-base py-3"
                      style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                    >
                      <span className="hidden xs:inline text-white">LANJUT</span>
                      <ChevronRight size={18} className="text-white" />
                    </ThemeButton>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key={activePage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={isScoreCheckPage ? "space-y-3" : "space-y-6"}
            >
              <div className={`bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border-2 border-white/60 shadow-xl max-w-2xl mx-auto ${
                isScoreCheckPage ? 'p-4 md:p-6 space-y-3' : 'space-y-6'
              }`}>
                <div className={`text-center font-sans ${isScoreCheckPage ? 'space-y-1' : 'space-y-3'}`}>
                  <div className="relative flex items-center justify-center gap-2">
                    <h1 className={`font-black text-slate-800 uppercase tracking-tight ${
                      currentPage.titleSize === 'sm' ? 'text-sm' :
                      currentPage.titleSize === 'base' ? 'text-base' :
                      currentPage.titleSize === 'lg' ? 'text-lg' :
                      currentPage.titleSize === 'xl' ? 'text-xl' :
                      'text-2xl'
                    }`}>
                      {currentPage.title}
                    </h1>
                    {currentPage.isSheet && currentPage.sheetUrl && isTeacher && (
                      <button
                        onClick={() => window.open(currentPage.sheetUrl, '_blank')}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                        title="Buka Link Sheet (Guru)"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )}
                  </div>
                  {((moduleNumber === 2 || moduleNumber === 3 || moduleNumber === 4) && activePage === 0) && (
                    <p className="text-xs font-bold text-slate-500 tracking-wide mt-0.5 block">Cek Apakah Nilai Kamu sudah masuk.</p>
                  )}
                  {currentPage.triggerQuestion && (
                    <p className="text-sm font-bold italic text-slate-800">"{currentPage.triggerQuestion}"</p>
                  )}
                </div>

                {currentPage.videoUrl && <VideoPlayer url={currentPage.videoUrl} title={currentPage.title} />}
                
                {currentPage.isSheet && currentPage.content && (
                  <div className={`prose prose-slate max-w-none text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl whitespace-pre-line font-bold text-center leading-relaxed ${
                    isScoreCheckPage ? 'p-3 text-xs md:text-sm' : 'p-4'
                  }`}>
                    {currentPage.content}
                  </div>
                )}

                {currentPage.isSheet && currentPage.sheetUrl && (
                  <div className={`space-y-4 ${isScoreCheckPage ? 'my-2' : 'my-4'}`}>
                    <div className="relative h-[600px] w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
                      <iframe 
                        src={currentPage.sheetUrl}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {currentPage.isForm && currentPage.formUrl && (
                  <div className="space-y-4 my-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl shadow-sm">
                      <div className="text-left space-y-1">
                        <p className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                          <span>💡 PETUNJUK UNGGAH POSTER</span>
                        </p>
                        <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                          Jika formulir di bawah meminta login atau tidak muncul tombol unggah file, klik tombol di samping untuk mengunggah poster langsung di tab baru.
                        </p>
                      </div>
                      <a 
                        href={currentPage.formUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow transition-all whitespace-nowrap cursor-pointer hover:shadow-md"
                      >
                        <ExternalLink size={14} />
                        <span>Buka Form (Tab Baru)</span>
                      </a>
                    </div>
                    <div className="relative h-[700px] w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
                      <iframe 
                        src={currentPage.formUrl.includes('embedded=true') ? currentPage.formUrl : `${currentPage.formUrl}${currentPage.formUrl.includes('?') ? '&' : '?'}embedded=true`}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                      >
                        Memuat Formulir Google...
                      </iframe>
                    </div>
                  </div>
                )}

                {!currentPage.isSheet && (
                  <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line font-medium leading-relaxed text-justify">
                    {renderFormattedText(currentPage.content)}
                  </div>
                )}

                {currentPage.imageUrl && (
                  <div className="space-y-5 my-6 flex flex-col items-center justify-center">
                    <div 
                      onClick={() => setZoomedImage(currentPage.imageUrl || null)}
                      className="relative group cursor-pointer overflow-hidden rounded-2xl border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-300 max-w-full"
                      title="Klik untuk memperbesar gambar"
                    >
                      <img 
                        src={currentPage.imagePreviewUrl || currentPage.imageUrl} 
                        alt={currentPage.title} 
                        className="max-h-[480px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-black shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          🔍 Klik untuk Memperbesar
                        </span>
                      </div>
                    </div>

                    <a 
                      href={currentPage.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <ExternalLink size={14} />
                      <span>Buka Gambar (Tab Baru)</span>
                    </a>
                  </div>
                )}

                {currentPage.isDriveFolder && currentPage.driveFolderUrl && (
                  <div className="space-y-4 my-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-blue-50 border border-blue-200/80 rounded-2xl shadow-sm">
                      <div className="text-left space-y-1">
                        <p className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                          <span>📁 GOOGLE DRIVE KELAS</span>
                        </p>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                          Kamu dapat melihat kumpulan karya dan hasil desain teman-teman sekelas lainnya langsung di folder Google Drive ini.
                        </p>
                      </div>
                      <a 
                        href={currentPage.driveFolderUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black shadow transition-all whitespace-nowrap cursor-pointer hover:shadow-md"
                      >
                        <ExternalLink size={14} />
                        <span>Buka Folder Drive (Tab Baru)</span>
                      </a>
                    </div>
                  </div>
                )}

                {currentPage.copyablePrompt && (
                  <div className="mt-4 p-4 bg-slate-50 border-2 border-slate-200/80 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        Prompt ChatGPT / Gemini
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentPage.copyablePrompt || '');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all shadow-sm ${
                          copied 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 cursor-pointer hover:shadow'
                        }`}
                        title="Klik untuk menyalin"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="text-slate-500" />
                            <span>Salin Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 bg-white font-mono text-xs text-slate-700 border border-slate-100 rounded-xl leading-relaxed whitespace-pre-wrap select-all cursor-pointer hover:bg-slate-50/50 transition-colors/50 shadow-inner" title="Klik ganda untuk memilih semua">
                      {renderFormattedText(currentPage.copyablePrompt)}
                    </div>
                  </div>
                )}

                {((moduleNumber === 2 || moduleNumber === 3 || moduleNumber === 4) && activePage === 0) ? (
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-center space-y-4 max-w-sm mx-auto shadow-sm">
                    <p className="text-slate-800 font-extrabold text-base md:text-lg">Nilaimu sudah ada?</p>
                    <div className="flex gap-4 justify-center">
                      <button 
                        onClick={() => {
                          if (onRedirect) {
                            onRedirect(moduleNumber - 1, 0);
                          }
                        }}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 hover:shadow-md text-white font-black rounded-xl transition-all text-sm active:scale-95 flex items-center justify-center"
                      >
                        <span>BELUM</span>
                      </button>
                      <button 
                        onClick={() => {
                          setCompletedPages(prev => prev.includes(0) ? prev : [...prev, 0]);
                          setActivePage(1);
                          setQuizActive(false);
                          setQuizSelected(null);
                        }}
                        className="flex-1 py-3 text-white font-black rounded-xl transition-all text-sm active:scale-95 flex items-center justify-center hover:shadow-md hover:brightness-105"
                        style={{ backgroundColor: darkenColor(theme.accent, 0.2) }}
                      >
                        <span>SUDAH</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row gap-2 justify-center">
                    {/* Always show back button if not first page */}
                    {activePage > 0 && (
                      <ThemeButton 
                        theme={theme}
                        onClick={() => {
                          setActivePage(activePage - 1);
                          setQuizActive(false);
                        }}
                        className="flex-1 px-2 text-sm sm:text-base py-3"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Kembali</span>
                      </ThemeButton>
                    )}
                    
                    {/* Challenge Button logic */}
                    {currentPage.quiz && (
                      <ThemeButton 
                        theme={theme}
                        disabled={quizDelay}
                        onClick={() => setQuizActive(!quizActive)}
                        className="flex-[2] px-2 text-sm sm:text-base py-3 disabled:opacity-50"
                        style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                      >
                        {completedPages.includes(activePage) 
                          ? (quizActive ? 'Tutup Tantangan' : 'Lihat Tantangan')
                          : 'Jawab Tantangan'
                        }
                      </ThemeButton>
                    )}

                    {/* Next Button / Complete Button logic */}
                    {completedPages.includes(activePage) && (
                      activePage < data.pages.length - 1 ? (
                        <ThemeButton
                          theme={theme}
                          disabled={quizDelay}
                          onClick={() => {
                            setActivePage(activePage + 1);
                            setQuizActive(false);
                          }}
                          className="flex-1 px-2 text-sm sm:text-base py-3 disabled:opacity-50"
                          style={{ backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' }}
                        >
                          <span className="hidden xs:inline text-white">LANJUT</span>
                          <ChevronRight size={18} className="text-white" />
                        </ThemeButton>
                      ) : (
                        <ThemeButton
                          theme={theme}
                          disabled={quizDelay}
                          onClick={() => {
                            onComplete();
                          }}
                          className="flex-1 px-2 text-sm sm:text-base py-3 disabled:opacity-50"
                          style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                        >
                          <span className="text-white font-bold">SELESAI</span>
                          <CheckCircle2 size={18} className="text-white ml-1.5 inline" />
                        </ThemeButton>
                      )
                    )}
                  </div>
                )}
              </div>

              {(quizActive || (!completedPages.includes(activePage) && quizActive)) && currentPage.quiz && (
                <motion.div 
                  ref={quizRef}
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 p-6 rounded-3xl shadow-xl max-w-xl mx-auto border"
                >
                  <p className="font-black text-slate-800 mb-4 text-center">{currentPage.quiz.question}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {currentPage.quiz.options.map(opt => {
                      const isCompleted = completedPages.includes(activePage);
                      const isSelected = quizSelected === opt.id || (isCompleted && opt.isCorrect);
                      const isCorrect = opt.isCorrect;
                      
                      return (
                        <button 
                          key={opt.id}
                          disabled={isCompleted}
                          onClick={() => handleQuiz(opt.id)}
                          className={`p-3 rounded-xl border-2 text-left font-bold transition-all ${
                            isSelected 
                            ? 'shadow-sm'
                            : `border-slate-100 bg-white ${isCompleted ? 'cursor-default' : 'hover:border-slate-300 text-slate-700'}`
                          }`}
                          style={!isSelected ? { color: isCompleted ? '#94a3b8' : '#334155' } : {
                            borderColor: isCorrect ? '#10b981' : '#f43f5e',
                            backgroundColor: isCorrect ? '#ecfdf5' : '#fff1f2',
                            color: isCorrect ? '#065f46' : '#9f1239'
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span>{opt.text}</span>
                            {isCompleted && isCorrect && <CheckCircle2 size={16} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Simplified Popup */}
      <AnimatePresence>
        {showPopup.show && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100] backdrop-blur-sm bg-black/40">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className={`max-w-sm w-full p-8 rounded-[3rem] text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 bg-white`}
              style={{ borderColor: showPopup.type === 'success' ? theme.accent : '#f43f5e' }}
            >
              <div className={`mx-auto mb-8 flex items-center justify-center gap-4 ${
                showPopup.type === 'success' ? '' : 'w-24 h-24 rounded-full bg-rose-50 text-rose-600 border-4 border-rose-100'
              }`}>
                {showPopup.type === 'success' ? (
                  !showPopup.hideScore ? (
                    <>
                      <motion.div
                        initial={{ rotate: -20, scale: 0.5 }}
                        animate={{ rotate: -10, scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        <Trophy size={48} className="text-amber-400 fill-amber-400/20" />
                      </motion.div>
                      
                      <motion.div 
                        className="relative -ml-2"
                        initial={{ scale: 0.5, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                      >
                        <span className="text-8xl font-black italic tracking-tighter drop-shadow-[0_4px_6px_rgba(217,119,6,0.2)]" style={{ color: '#d97706' }}>100</span>
                      </motion.div>

                      <motion.div
                        initial={{ rotate: 20, scale: 0.5 }}
                        animate={{ rotate: 10, scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        <Trophy size={48} className="text-amber-400 fill-amber-400/20" />
                      </motion.div>
                    </>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 size={48} />
                    </div>
                  )
                ) : <X size={48} />}
              </div>
              <h3 className={`text-4xl font-black mb-2`} style={{ color: showPopup.type === 'success' ? '#0f172a' : '#881337' }}>
                {showPopup.praise || (showPopup.type === 'success' ? 'Berhasil!' : 'Ups!')}
              </h3>
              {showPopup.message && (
                <p className="text-slate-600 font-extrabold mb-8 leading-relaxed text-lg">{showPopup.message}</p>
              )}
              {!showPopup.message && <div className="mb-10" />}
              <ThemeButton 
                theme={theme}
                onClick={handlePopupClick}
                fullWidth
                size="lg"
                className="py-5 text-xl tracking-widest"
                style={showPopup.type === 'success' 
                  ? { backgroundColor: darkenColor(theme.bgMain, 0.25), background: darkenColor(theme.bgMain, 0.25), color: '#ffffff' } 
                  : { backgroundColor: '#f43f5e' }
                }
              >
                {showPopup.type === 'success' ? 'LANJUT' : 'COBA LAGI'}
              </ThemeButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 sm:-right-4 text-white hover:text-rose-400 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={28} />
              </button>
              <img 
                src={zoomedImage} 
                alt="Zoomed Poster Preview" 
                className="rounded-2xl border-4 border-white/20 max-h-[80vh] w-auto object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="mt-4 flex gap-4">
                <a 
                  href={zoomedImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow transition-all whitespace-nowrap cursor-pointer active:scale-95"
                >
                  <ExternalLink size={16} />
                  <span>Buka di Tab Baru</span>
                </a>
                <button
                  onClick={() => setZoomedImage(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
