import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ChevronDown, 
  Search, 
  Check, 
  AlertCircle, 
  GraduationCap, 
  KeyRound, 
  X, 
  ShieldCheck,
  School
} from 'lucide-react';
import { GardenDecorations } from './GardenDecorations';
import { firestoreService } from '../services/firestoreService';
import { sheetService } from '../services/sheetService';
import { AppSettings, ClassItem, StudentItem } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_CLASSES } from '../services/defaultData';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface LoginProps {
  username: string;
  setUsername: (name: string) => void;
  userClass: string;
  setUserClass: (className: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onOpenAdmin?: () => void;
  settings?: AppSettings;
}

/**
 * Login component with strict student validation, synchronous class-student linking,
 * searchable auto-filter student dropdown, and hardcoded teacher bypass for 'GURUSMP'.
 */
export const Login: React.FC<LoginProps> = ({ 
  username, 
  setUsername, 
  userClass, 
  setUserClass, 
  onLogin,
  onOpenAdmin,
  settings: propSettings
}) => {
  const [classesList, setClassesList] = useState<ClassItem[]>(DEFAULT_CLASSES);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(propSettings || DEFAULT_SETTINGS);
  const [authError, setAuthError] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  // Searchable student dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(username || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propSettings) {
      setCurrentSettings(propSettings);
    }
  }, [propSettings]);

  useEffect(() => {
    firestoreService.getSettings().then(st => {
      if (st) setCurrentSettings(st);
    }).catch(err => console.error('Error fetching settings in Login:', err));
  }, []);

  const logoUrl = normalizeImageUrl(currentSettings?.logoUrl || "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png");
  const shouldAnimateLogo = currentSettings?.logoAnimation !== false;
  const welcomeTitle = currentSettings?.homeWelcomeTitle || "Selamat Datang di Modul Berkebun SMPN 1 Bengkalis";
  const quoteText = currentSettings?.homeQuote || "“Satu langkah kecil hari ini, Menyelamatkan hidup di masa depan”";

  // Clean old legacy dummy cache if any
  useEffect(() => {
    try {
      const cachedClassesStr = localStorage.getItem('garden_app_classes');
      if (cachedClassesStr) {
        const cachedCls: ClassItem[] = JSON.parse(cachedClassesStr);
        const hasLegacyDummy = cachedCls.some(c => c.id === 'std_8d_jos' || (c.description === 'Kelas Reguler' && cachedCls.length === 9));
        if (hasLegacyDummy) {
          localStorage.removeItem('garden_app_classes');
          localStorage.removeItem('garden_app_students');
        }
      }
    } catch {}
  }, []);

  // Fetch live classes and students
  const loadClassesAndStudents = async () => {
    setIsLoadingData(true);
    try {
      const [cachedClasses, cachedStudents] = await Promise.all([
        firestoreService.getClasses(),
        firestoreService.getStudents()
      ]);

      const activeClasses = (cachedClasses || []).filter(c => c.isActive !== false);
      const activeStudents = (cachedStudents || []).filter(s => s.status !== 'Non-Aktif');

      if (activeClasses.length > 0) {
        setClassesList(activeClasses);
      }
      if (activeStudents.length > 0) {
        setAllStudents(activeStudents);
      }
    } catch (err) {
      console.warn('Initial cache load notice:', err);
    }

    // Background sync from Google Sheet if connected
    try {
      const sheetRes = await sheetService.fetchDataFromSheet();
      if (sheetRes.success && ((sheetRes.classes && sheetRes.classes.length > 0) || (sheetRes.students && sheetRes.students.length > 0))) {
        const validClasses = (sheetRes.classes || []).filter(c => c.isActive !== false);
        const validStudents = (sheetRes.students || []).filter(s => s.status !== 'Non-Aktif');
        
        if (validClasses.length > 0) {
          setClassesList(validClasses);
          // Persist to Firestore
          for (const cls of validClasses) {
            firestoreService.saveClass(cls).catch(() => {});
          }
        }
        if (validStudents.length > 0) {
          setAllStudents(validStudents);
          // Persist to Firestore
          for (const std of validStudents) {
            firestoreService.saveStudent(std).catch(() => {});
          }
        }
      }
    } catch (sheetErr) {
      console.warn('Background Google Sheet sync notice:', sheetErr);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadClassesAndStudents();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync searchTerm with username prop
  useEffect(() => {
    if (username !== searchTerm) {
      setSearchTerm(username);
    }
  }, [username]);

  // Filter students for the selected class (strictly synced with Kelola Kelas)
  const classStudents = useMemo(() => {
    if (!userClass || userClass === 'guru') return [];
    const cleanClass = userClass.trim().toUpperCase();
    return allStudents.filter(s => 
      s.userClass && s.userClass.trim().toUpperCase() === cleanClass && s.status !== 'Non-Aktif'
    ).sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
  }, [allStudents, userClass]);

  // Search filtered student suggestions based on user typing
  const filteredStudentSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    
    // Check if query is teacher keyword
    const isTeacherKey = query === 'gurusmp';

    if (!query) {
      return classStudents;
    }

    const matched = classStudents.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.nisn && s.nisn.toLowerCase().includes(query))
    );

    return matched;
  }, [classStudents, searchTerm]);

  const handleClassChange = (selectedCls: string) => {
    setAuthError('');
    setUserClass(selectedCls);
    // If the currently selected student doesn't belong to this class, clear student name
    if (username && username.trim().toLowerCase() !== 'gurusmp') {
      const existsInNewClass = allStudents.some(
        s => s.userClass?.trim().toUpperCase() === selectedCls.trim().toUpperCase() &&
             s.name.trim().toUpperCase() === username.trim().toUpperCase()
      );
      if (!existsInNewClass) {
        setUsername('');
        setSearchTerm('');
      }
    }
    // Auto open student dropdown once class is selected to guide the user
    setTimeout(() => {
      setIsDropdownOpen(true);
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const handleInputChange = (val: string) => {
    setAuthError('');
    setSearchTerm(val);
    setUsername(val);
    if (val.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const handleSelectStudent = (studentName: string) => {
    setAuthError('');
    setUsername(studentName);
    setSearchTerm(studentName);
    setIsDropdownOpen(false);
  };

  const handleClearInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUsername('');
    setSearchTerm('');
    setAuthError('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsDropdownOpen(false);

    const cleanUser = (searchTerm || username).trim();
    const cleanCls = userClass.trim();

    // 1. Secret Teacher Login Bypass (Requires no class selection, completely hidden from UI)
    if (cleanUser.toLowerCase() === 'gurusmp' || cleanCls.toLowerCase() === 'guru') {
      setUserClass('guru');
      setUsername('GURUSMP');
      sheetService.recordLogin('GURUSMP', 'guru');
      onLogin(e);
      return;
    }

    if (!cleanCls) {
      setAuthError('Silakan pilih Kelas Anda terlebih dahulu.');
      return;
    }

    if (!cleanUser) {
      setAuthError('Silakan pilih atau ketik Nama Siswa Anda.');
      return;
    }

    // 2. Student login verification
    let resolvedStudentName = cleanUser;

    if (classStudents.length > 0) {
      const matchedStudent = classStudents.find(s => 
        s.name.trim().toUpperCase() === cleanUser.toUpperCase() || 
        (s.nisn && s.nisn.trim() === cleanUser)
      );

      if (matchedStudent) {
        resolvedStudentName = matchedStudent.name;
      } else {
        // Auto register new student into Firestore
        firestoreService.saveStudent({
          name: cleanUser,
          userClass: cleanCls,
          status: 'Aktif'
        }).catch(err => console.warn('Auto save student warning:', err));
      }
    } else {
      // No roster yet for this class: auto register student to this class in Firestore
      firestoreService.saveStudent({
        name: cleanUser,
        userClass: cleanCls,
        status: 'Aktif'
      }).catch(err => console.warn('Auto save student warning:', err));
    }

    // Set properly capitalized registered name
    setUsername(resolvedStudentName);
    
    // Record login activity in background
    sheetService.recordLogin(resolvedStudentName, cleanCls);

    // Proceed to app
    onLogin(e);
  };

  // Helper to highlight matching search characters
  const renderHighlightedName = (name: string, query: string) => {
    if (!query) return <span>{name}</span>;
    const index = name.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{name}</span>;
    
    const before = name.substring(0, index);
    const match = name.substring(index, index + query.length);
    const after = name.substring(index + query.length);

    return (
      <span>
        {before}
        <span className="bg-purple-200 text-purple-900 font-black underline decoration-purple-500 rounded-xs px-0.5">{match}</span>
        {after}
      </span>
    );
  };

  return (
    <div id="app-wrapper" className="w-full h-screen overflow-hidden relative leaf-pattern" style={{ background: '#410052', fontFamily: "'Nunito', sans-serif" }}>
      <GardenDecorations />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="bg-black/25 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/15 shadow-2xl max-w-xl w-full flex flex-col items-center">
          
          {/* Header Title & Animated Logo */}
          <div className="fade-up-d1 flex flex-col items-center gap-3 mb-3">
            <motion.div
              animate={shouldAnimateLogo ? { rotateY: 360 } : { rotateY: 0 }}
              transition={shouldAnimateLogo ? { duration: 14, repeat: Infinity, ease: "linear" } : undefined}
              style={{ perspective: 1000 }}
            >
              <img 
                src={logoUrl} 
                alt="Logo Sekolah" 
                className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png";
                }}
              />
            </motion.div>
            <h1 id="hero-title" className="text-xl md:text-3xl font-black leading-tight whitespace-pre-line" style={{ fontFamily: "'Playfair Display', serif", color: '#f3e8ff' }}>
              {welcomeTitle}
            </h1>
          </div>

          {/* Decorative line */}
          <div className="fade-up-d1 flex items-center gap-3 my-1.5">
            <div style={{ background: '#d8b4fe', height: '2px', width: '40px', borderRadius: '2px' }}></div>
            <span className="text-lg">🍇</span>
            <div style={{ background: '#d8b4fe', height: '2px', width: '40px', borderRadius: '2px' }}></div>
          </div>

          {/* Subtitle / Quote */}
          <div className="fade-up-d2 space-y-1 mb-2">
            <p id="hero-subtitle" className="text-sm md:text-base max-w-md leading-relaxed mx-auto italic" style={{ color: '#d8b4fe', opacity: 0.9 }}>
              {quoteText}
            </p>
          </div>

          {/* Auth Error Notification */}
          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fade-up-d2 w-full max-w-xs md:max-w-md mb-3 px-4 py-2.5 bg-rose-950/90 border border-rose-400/80 rounded-2xl text-xs text-rose-100 text-left font-semibold shadow-xl flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">
                  {authError}
                </div>
                <button 
                  onClick={() => setAuthError('')}
                  className="text-rose-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name & Class Input Form */}
          <div className="fade-up-d3 mt-1 w-full max-w-xs md:max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              
              {/* 1. SELECT KELAS */}
              <div className="relative w-full text-left">
                <label className="text-[11px] text-purple-200 font-bold block mb-1 px-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <School size={13} className="text-purple-300" />
                    Pilih Kelas Anda:
                  </span>
                  {userClass && (
                    <span className="text-emerald-300 font-extrabold text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {classStudents.length} Siswa Terdaftar
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    id="login-class-select"
                    value={userClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-5 py-3 md:py-3.5 rounded-2xl text-base md:text-lg font-bold border-2 transition-all outline-hidden appearance-none cursor-pointer bg-white/95 border-purple-300 text-purple-950 hover:border-purple-400 focus:border-purple-600 shadow-md"
                  >
                    <option value="">
                      {isLoadingData ? 'Memuat Daftar Kelas...' : '-- PILIH KELAS --'}
                    </option>
                    {classesList.map((c, idx) => {
                      const count = allStudents.filter(s => (s.userClass || '').toUpperCase() === (c.name || c.id).toUpperCase()).length;
                      return (
                        <option key={`cls-${c.id || c.name}-${idx}`} value={c.name}>
                          Kelas {c.name} {count > 0 ? `(${count} Siswa)` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-900">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              {/* 2. SEARCHABLE STUDENT NAME DROPDOWN */}
              <div className="relative w-full text-left" ref={dropdownRef}>
                <label className="text-[11px] text-purple-200 font-bold block mb-1 px-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User size={13} className="text-purple-300" />
                    Pilih / Ketik Nama Siswa:
                  </span>
                </label>

                <div className="relative">
                  <input 
                    ref={inputRef}
                    id="login-name-input"
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (userClass) setIsDropdownOpen(true);
                    }}
                    onClick={() => {
                      if (userClass) setIsDropdownOpen(true);
                    }}
                    placeholder={userClass ? `Ketik nama Anda...` : `Ketik nama siswa...`}
                    className="w-full pl-5 pr-12 py-3 md:py-3.5 rounded-2xl text-base md:text-lg font-bold border-2 transition-all outline-hidden bg-white/95 border-purple-300 text-purple-950 hover:border-purple-400 focus:border-purple-600 shadow-md placeholder:text-slate-400"
                    autoComplete="off"
                  />

                  {/* Clear / Status Action Icons */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                        title="Hapus ketikan"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {userClass && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(!isDropdownOpen);
                          if (inputRef.current) inputRef.current.focus();
                        }}
                        className="p-1 text-purple-900 hover:text-purple-700 transition-colors cursor-pointer"
                      >
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* FLOATING FILTERABLE DROPDOWN MENU */}
                <AnimatePresence>
                  {isDropdownOpen && userClass && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border-2 border-purple-300 overflow-hidden max-h-64 flex flex-col text-slate-800"
                    >
                      {/* Dropdown Header Info */}
                      <div className="px-3.5 py-2 bg-purple-50 border-b border-purple-100 flex items-center justify-between text-xs font-bold text-purple-900">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap size={14} className="text-purple-700" />
                          Daftar Siswa Kelas {userClass}
                        </span>
                        <span className="text-[11px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                          {filteredStudentSuggestions.length} dari {classStudents.length} siswa
                        </span>
                      </div>

                      {/* Dropdown Student List */}
                      <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-1">
                        {classStudents.length === 0 ? (
                          <div className="p-4 text-center text-slate-500">
                            <p className="text-xs font-bold mb-1">Belum ada siswa terdaftar di Kelas {userClass}</p>
                            <p className="text-[11px] text-slate-400">Hubungi Guru/Admin untuk menambahkan data siswa di kelas ini.</p>
                          </div>
                        ) : filteredStudentSuggestions.length === 0 ? (
                          <div className="p-4 text-center text-slate-500">
                            <p className="text-xs font-bold text-rose-600 mb-1">Nama "{searchTerm}" tidak ditemukan di Kelas {userClass}</p>
                            <p className="text-[11px] text-slate-400 mb-2">
                              Pastikan ejaan benar atau pilih langsung dari {classStudents.length} siswa terdaftar di bawah.
                            </p>
                            <button
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Tampilkan Semua Siswa Kelas {userClass}
                            </button>
                          </div>
                        ) : (
                          filteredStudentSuggestions.map((student, idx) => {
                            const isSelected = username.trim().toUpperCase() === student.name.trim().toUpperCase();
                            return (
                              <button
                                key={`opt-std-${student.id || idx}`}
                                type="button"
                                onClick={() => handleSelectStudent(student.name)}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-purple-100 text-purple-950 font-black' 
                                    : 'hover:bg-purple-50/80 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <p className="text-xs font-bold truncate">
                                      {renderHighlightedName(student.name, searchTerm)}
                                    </p>
                                    {student.nisn && (
                                      <p className="text-[10px] text-slate-400 truncate">
                                        NISN: {student.nisn}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                    <Check size={12} />
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-purple-600 font-semibold shrink-0 opacity-0 group-hover:opacity-100">
                                    Pilih
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>🔒 Hanya nama terdaftar yang diizinkan masuk</span>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                        >
                          Tutup [x]
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button 
                id="login-submit-btn"
                type="submit" 
                className="btn-garden pulse-glow inline-flex items-center justify-center gap-2.5 px-8 py-3.5 md:py-4 rounded-2xl text-lg md:text-xl font-bold tracking-wide mt-2 shadow-xl hover:brightness-110 active:scale-98 transition-all cursor-pointer bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-purple-600/30"
                style={{ border: 'none' }}
              > 
                <ShieldCheck size={20} />
                <span>MASUK BELAJAR</span> 
              </button>
            </form>
          </div>

          {/* Tagline */}
          <p id="tagline" className="fade-up-d3 mt-5 text-xs md:text-sm tracking-widest uppercase" style={{ color: '#d8b4fe', opacity: 0.7 }}>
            🍇 Modul Pembelajaran IPA Berkelanjutan 🍇
          </p>
          <p className="fade-up-d3 mt-1 text-[10px] font-bold tracking-wide" style={{ color: '#d8b4fe', opacity: 0.85 }}>
            SMP NEGERI 1 BENGKALIS
          </p>
        </div>
      </main>
    </div>
  );
};
