import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AppModule, 
  QuizConfig, 
  ClassItem, 
  StudentItem, 
  ScoreRecord, 
  ActivityLog, 
  AppSettings,
  ModulePage,
  QuizQuestion,
  GameItem
} from '../types';
import { 
  getDefaultModules, 
  getDefaultQuizzes, 
  getDefaultGames,
  DEFAULT_CLASSES, 
  DEFAULT_STUDENTS,
  DEFAULT_SETTINGS 
} from './defaultData';
import { GAME_TEMPLATES } from '../utils/gameTemplates';

const LOCAL_STORAGE_PREFIX = 'ipa_firestore_cache_';

// Helper to get local cache synchronously (Instant 0ms)
const getSafeCached = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
};

const setSafeCached = (key: string, data: any): void => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(data));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}_init`, 'true');
  } catch (err) {
    console.warn(`LocalStorage write error for ${key}:`, err);
  }
};

// Resilient fast timeout for background or fallback network calls (default 3.5s)
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 3500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Koneksi database Firestore membutuhkan waktu lebih lama (timeout)')), timeoutMs))
  ]);
};

// Helper to reliably hydrate game metadata, code, instructions and pass scores for any game page
export const hydrateModulePages = (pages: ModulePage[], gamesList?: GameItem[]): ModulePage[] => {
  const gms = gamesList && gamesList.length > 0 ? gamesList : getDefaultGames();
  return (pages || []).map(p => {
    const isGamePage = Boolean(p.isGame || p.gameId || (p.gameCode && p.gameCode.trim()) || (p.gameType && p.gameType !== ''));
    if (!isGamePage) return p;

    const matched = gms.find(g => 
      (p.gameId && g.id === p.gameId) || 
      (p.gameType && (g.id === p.gameType || g.type === p.gameType)) ||
      (p.gameId && g.type === p.gameId)
    ) || getDefaultGames().find(g => 
      (p.gameId && g.id === p.gameId) || 
      (p.gameType && (g.id === p.gameType || g.type === p.gameType)) ||
      (p.gameId && g.type === p.gameId)
    );

    let resolvedCode = p.gameCode;
    if ((!resolvedCode || !resolvedCode.trim()) && matched?.code) {
      resolvedCode = matched.code;
    }
    if ((!resolvedCode || !resolvedCode.trim()) && (p.gameType === 'custom_html' || p.gameType === 'custom_tsx')) {
      const defaultTpl = GAME_TEMPLATES.find(t => t.type === p.gameType) || GAME_TEMPLATES[0];
      resolvedCode = defaultTpl?.code || '';
    }

    const resolvedGameType = p.gameType || matched?.type || (resolvedCode ? 'custom_html' : 'memory');

    return {
      ...p,
      isGame: true,
      gameId: p.gameId || matched?.id,
      gameType: resolvedGameType,
      gameCode: resolvedCode || '',
      gameInstructions: p.gameInstructions || matched?.instructions || p.content || 'Ikuti petunjuk permainan dengan teliti.',
      gamePassScore: p.gamePassScore || matched?.passScore || 70,
      gameAssets: p.gameAssets || (p as any).items || matched?.items
    };
  });
};

export const firestoreService = {
  getDefaultModulesList: (): AppModule[] => {
    return getDefaultModules();
  },

  // --- MODULES CRUD (Instant SWR Cache) ---
  getModules: async (): Promise<AppModule[]> => {
    const cachedGames = getSafeCached<GameItem[]>('games') || getDefaultGames();

    // 1. Return cached instantly if available (<1ms)
    const cachedMods = getSafeCached<AppModule[]>('modules');
    const isInit = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}modules_init`);
    if (cachedMods && (cachedMods.length > 0 || isInit === 'true')) {
      // Trigger background silent revalidation without blocking
      setTimeout(() => {
        firestoreService.fetchRemoteModules().catch(() => {});
      }, 50);

      return cachedMods.map((m: AppModule) => ({
        ...m,
        pages: hydrateModulePages(m.pages, cachedGames)
      }));
    }

    // 2. No cache yet: try fetching from Firestore with snappy timeout
    try {
      const remote = await firestoreService.fetchRemoteModules();
      if (remote && remote.length > 0) {
        return remote;
      }
    } catch {}

    // 3. Fallback to default rich modules instantly
    const defaultMods = getDefaultModules().map(m => ({
      ...m,
      pages: hydrateModulePages(m.pages, cachedGames)
    }));
    setSafeCached('modules', defaultMods);
    firestoreService.syncLocalModulesToCloud(defaultMods).catch(() => {});
    return defaultMods;
  },

  fetchRemoteModules: async (): Promise<AppModule[]> => {
    const cachedGames = getSafeCached<GameItem[]>('games') || getDefaultGames();
    const colRef = collection(db, 'modules');
    const q = query(colRef);
    const snap = await withTimeout(getDocs(q), 4000);
    
    if (!snap.empty) {
      const modules: AppModule[] = [];
      snap.forEach(docSnap => {
        const mod = docSnap.data() as AppModule;
        mod.pages = hydrateModulePages(mod.pages, cachedGames);
        modules.push(mod);
      });
      modules.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
      setSafeCached('modules', modules);
      return modules;
    }
    return [];
  },

  syncLocalModulesToCloud: async (modulesToSync?: AppModule[]): Promise<void> => {
    try {
      const mods = modulesToSync || (await firestoreService.getModules());
      for (const m of mods) {
        const docRef = doc(db, 'modules', `mod_${m.id}`);
        await setDoc(docRef, m, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Background syncLocalModulesToCloud error:', e);
    }
  },

  getModuleById: async (moduleId: number): Promise<AppModule | null> => {
    let gamesList: GameItem[] = [];
    try {
      gamesList = await firestoreService.getGames();
    } catch {}

    try {
      const docRef = doc(db, 'modules', `mod_${moduleId}`);
      const snap = await withTimeout(getDoc(docRef), 6000);
      if (snap.exists()) {
        const mod = snap.data() as AppModule;
        return {
          ...mod,
          pages: hydrateModulePages(mod.pages, gamesList)
        };
      }
    } catch (e) {
      console.warn(`Firestore getModuleById(${moduleId}) fallback used:`, e);
    }

    // Fallback
    const modules = await firestoreService.getModules();
    const found = modules.find(m => m.id === moduleId);
    if (found) {
      return {
        ...found,
        pages: hydrateModulePages(found.pages, gamesList)
      };
    }

    const defMod = getDefaultModules().find(m => m.id === moduleId);
    if (defMod) {
      return {
        ...defMod,
        pages: hydrateModulePages(defMod.pages, gamesList)
      };
    }
    return null;
  },

  saveModule: async (moduleData: AppModule): Promise<void> => {
    let gamesList: GameItem[] = [];
    try {
      gamesList = await firestoreService.getGames();
    } catch {}

    const cleanPayload: AppModule = JSON.parse(JSON.stringify(moduleData));
    cleanPayload.pages = hydrateModulePages(cleanPayload.pages, gamesList);

    // 1. Update local cache immediately
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}modules`);
      let list: AppModule[] = [];
      if (cached) {
        try { list = JSON.parse(cached); } catch {}
      }
      const index = list.findIndex(m => m.id === cleanPayload.id);
      if (index >= 0) {
        list[index] = cleanPayload;
      } else {
        list.push(cleanPayload);
      }
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}modules`, JSON.stringify(list));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}modules_init`, 'true');
    } catch {}

    // 2. Save to Firestore asynchronously
    try {
      const docRef = doc(db, 'modules', `mod_${cleanPayload.id}`);
      await withTimeout(setDoc(docRef, cleanPayload, { merge: true }), 15000);
    } catch (e) {
      console.warn(`Firestore saveModule background warning:`, e);
    }
  },

  syncAllModulesAndGamesToCloud: async (
    customModules?: AppModule[],
    customGames?: GameItem[],
    onProgress?: (step: string, percent: number) => void
  ): Promise<{ success: boolean; message: string }> => {
    try {
      onProgress?.('Menyiapkan data modul dan game...', 10);
      let gms = customGames || (await firestoreService.getGames());
      if (!gms || gms.length === 0) {
        gms = firestoreService.getDefaultGamesList();
      }

      // Step 1: Sync all games in parallel
      onProgress?.('Menyinkronkan bank game ke Firestore...', 25);
      const gamePromises = gms.map(async (game, i) => {
        try {
          const cleanPayload = JSON.parse(JSON.stringify({
            ...game,
            updatedAt: new Date().toISOString()
          }));
          const docRef = doc(db, 'games', game.id);
          await setDoc(docRef, cleanPayload, { merge: true });
          onProgress?.(`Game ${game.title} tersinkron...`, 25 + Math.round(((i + 1) / gms.length) * 35));
        } catch (err) {
          console.warn(`Game ${game.id} sync warning:`, err);
        }
      });
      await Promise.allSettled(gamePromises);

      // Step 2: Sync all modules in parallel
      onProgress?.('Menyinkronkan seluruh modul dan materi ke Firestore...', 65);
      const mods = customModules || (await firestoreService.getModules());
      const modPromises = mods.map(async (mod, i) => {
        try {
          const updatedPages = hydrateModulePages(mod.pages || [], gms);
          const modToSave: AppModule = {
            ...mod,
            pages: updatedPages
          };
          const cleanPayload = JSON.parse(JSON.stringify(modToSave));
          const docRef = doc(db, 'modules', `mod_${cleanPayload.id}`);
          await setDoc(docRef, cleanPayload, { merge: true });
          onProgress?.(`Modul ${mod.id} (${mod.title}) tersinkron...`, 65 + Math.round(((i + 1) / mods.length) * 30));
        } catch (err) {
          console.warn(`Modul ${mod.id} sync warning:`, err);
        }
      });
      await Promise.allSettled(modPromises);

      onProgress?.('Sinkronisasi selesai!', 100);
      return {
        success: true,
        message: `Berhasil menyinkronkan ${mods.length} Modul Materi & ${gms.length} Game Edukasi ke Firebase Cloud! Seluruh game dan materi siap diakses oleh siapapun melalui link yang dibagikan.`
      };
    } catch (e: any) {
      console.error('syncAllModulesAndGamesToCloud error:', e);
      return {
        success: false,
        message: `Gagal sinkronisasi ke cloud: ${e?.message || 'Error jaringan'}`
      };
    }
  },

  deleteModule: async (moduleId: number): Promise<void> => {
    // 1. Immediately update local storage cache
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}modules`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((m: AppModule) => m.id !== moduleId);
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}modules`, JSON.stringify(filtered));
        }
      }
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}modules_init`, 'true');
    } catch (e) {
      console.warn('Local cache update for deleteModule error:', e);
    }

    // 2. Delete from Firestore asynchronously
    try {
      const docRef = doc(db, 'modules', `mod_${moduleId}`);
      await withTimeout(deleteDoc(docRef), 10000).catch(err => {
        console.warn(`deleteDoc module mod_${moduleId} warning:`, err);
      });
    } catch (e) {
      console.warn('Firestore deleteModule docRef error:', e);
    }

    // 3. Also delete corresponding quiz
    try {
      const quizRef = doc(db, 'quizzes', `quiz_${moduleId}`);
      await deleteDoc(quizRef).catch(() => {});
    } catch {}
  },

  // --- QUIZZES CRUD (Instant SWR Cache) ---
  getQuizzes: async (): Promise<QuizConfig[]> => {
    // 1. Return cached instantly if available (<1ms)
    const cached = getSafeCached<QuizConfig[]>('quizzes');
    const isInit = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}quizzes_init`);
    if (cached && (cached.length > 0 || isInit === 'true')) {
      setTimeout(() => {
        firestoreService.fetchRemoteQuizzes().catch(() => {});
      }, 50);
      return cached;
    }

    // 2. Fetch remote if no cache
    try {
      const remote = await firestoreService.fetchRemoteQuizzes();
      if (remote && remote.length > 0) return remote;
    } catch {}

    // 3. Fallback default
    const defaultQz = getDefaultQuizzes();
    setSafeCached('quizzes', defaultQz);
    firestoreService.syncLocalQuizzesToCloud(defaultQz).catch(() => {});
    return defaultQz;
  },

  fetchRemoteQuizzes: async (): Promise<QuizConfig[]> => {
    const colRef = collection(db, 'quizzes');
    const snap = await withTimeout(getDocs(colRef), 3500);
    if (!snap.empty) {
      const quizzes: QuizConfig[] = [];
      snap.forEach(docSnap => {
        quizzes.push(docSnap.data() as QuizConfig);
      });
      quizzes.sort((a, b) => a.moduleNumber - b.moduleNumber);
      setSafeCached('quizzes', quizzes);
      return quizzes;
    }
    return [];
  },

  syncLocalQuizzesToCloud: async (quizzesToSync?: QuizConfig[]): Promise<void> => {
    try {
      const qzs = quizzesToSync || (await firestoreService.getQuizzes());
      for (const q of qzs) {
        const docRef = doc(db, 'quizzes', `quiz_${q.moduleNumber}`);
        await setDoc(docRef, q, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Background syncLocalQuizzesToCloud error:', e);
    }
  },

  getQuizByModule: async (moduleNumber: number): Promise<QuizConfig | null> => {
    // 1. Instant check from cached quizzes
    const cached = getSafeCached<QuizConfig[]>('quizzes');
    const foundCached = cached?.find(q => q.moduleNumber === moduleNumber);
    if (foundCached && foundCached.questions && foundCached.questions.length > 0) {
      return foundCached;
    }

    try {
      const docRef = doc(db, 'quizzes', `quiz_${moduleNumber}`);
      const snap = await withTimeout(getDoc(docRef), 2500);
      if (snap.exists()) {
        const qz = snap.data() as QuizConfig;
        if (qz && qz.questions && qz.questions.length > 0) {
          return qz;
        }
      }
    } catch (e) {
      console.warn(`Firestore getQuizByModule(${moduleNumber}) fallback used:`, e);
    }

    const quizzes = await firestoreService.getQuizzes();
    const found = quizzes.find(q => q.moduleNumber === moduleNumber);
    if (found && found.questions && found.questions.length > 0) return found;

    return getDefaultQuizzes().find(q => q.moduleNumber === moduleNumber) || null;
  },

  saveQuiz: async (quizData: QuizConfig): Promise<void> => {
    try {
      const cached = getSafeCached<QuizConfig[]>('quizzes') || getDefaultQuizzes();
      const index = cached.findIndex(q => q.moduleNumber === quizData.moduleNumber);
      if (index >= 0) {
        cached[index] = quizData;
      } else {
        cached.push(quizData);
      }
      setSafeCached('quizzes', cached);
    } catch {}

    try {
      const docRef = doc(db, 'quizzes', `quiz_${quizData.moduleNumber}`);
      await withTimeout(setDoc(docRef, quizData, { merge: true }), 10000);
    } catch (e) {
      console.warn('Firestore saveQuiz background warning:', e);
    }
  },

  deleteQuiz: async (moduleNumber: number): Promise<void> => {
    try {
      const cached = getSafeCached<QuizConfig[]>('quizzes') || [];
      const filtered = cached.filter(q => q.moduleNumber !== moduleNumber);
      setSafeCached('quizzes', filtered);
    } catch {}

    try {
      const docRef = doc(db, 'quizzes', `quiz_${moduleNumber}`);
      await withTimeout(deleteDoc(docRef), 6000).catch(() => {});
    } catch (e) {
      console.warn('Firestore deleteQuiz failed:', e);
    }
  },

  // --- GAMES CRUD (Instant SWR Cache) ---
  getGames: async (): Promise<GameItem[]> => {
    // 1. Instant cache return
    const cached = getSafeCached<GameItem[]>('games');
    if (cached && cached.length > 0) {
      setTimeout(() => {
        firestoreService.fetchRemoteGames().catch(() => {});
      }, 50);
      return cached;
    }

    // 2. Fetch remote if no cache
    try {
      const remote = await firestoreService.fetchRemoteGames();
      if (remote && remote.length > 0) return remote;
    } catch {}

    // 3. Fallback default
    const defaultGames = getDefaultGames();
    setSafeCached('games', defaultGames);
    firestoreService.syncLocalGamesToCloud(defaultGames).catch(() => {});
    return defaultGames;
  },

  fetchRemoteGames: async (): Promise<GameItem[]> => {
    const colRef = collection(db, 'games');
    const snap = await withTimeout(getDocs(colRef), 3500);
    if (!snap.empty) {
      const games: GameItem[] = [];
      snap.forEach(docSnap => {
        games.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setSafeCached('games', games);
      return games;
    }
    return [];
  },

  syncLocalGamesToCloud: async (gamesToSync?: GameItem[]): Promise<void> => {
    try {
      const games = gamesToSync || (await firestoreService.getGames());
      for (const g of games) {
        const cleanPayload = JSON.parse(JSON.stringify({
          ...g,
          updatedAt: new Date().toISOString()
        }));
        const docRef = doc(db, 'games', g.id);
        await setDoc(docRef, cleanPayload, { merge: true });
      }
    } catch (e) {
      console.warn('Background syncLocalGamesToCloud error:', e);
    }
  },

  getGameById: async (gameId: string): Promise<GameItem | null> => {
    const cached = getSafeCached<GameItem[]>('games');
    const foundCached = cached?.find(g => g.id === gameId);
    if (foundCached) return foundCached;

    try {
      const docRef = doc(db, 'games', gameId);
      const snap = await withTimeout(getDoc(docRef), 2500);
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as any) };
      }
    } catch (e) {
      console.warn(`Firestore getGameById(${gameId}) fallback:`, e);
    }

    const games = await firestoreService.getGames();
    return games.find(g => g.id === gameId) || null;
  },

  saveGame: async (game: GameItem): Promise<void> => {
    const payload = JSON.parse(JSON.stringify({
      ...game,
      updatedAt: new Date().toISOString(),
      createdAt: game.createdAt || new Date().toISOString()
    }));

    // Update local storage first (instant)
    const cached = getSafeCached<GameItem[]>('games') || getDefaultGames();
    const idx = cached.findIndex(g => g.id === game.id);
    if (idx >= 0) {
      cached[idx] = payload;
    } else {
      cached.push(payload);
    }
    setSafeCached('games', cached);

    // Save to Firestore asynchronously
    try {
      const docRef = doc(db, 'games', game.id);
      await withTimeout(setDoc(docRef, payload, { merge: true }), 8000);
    } catch (e) {
      console.error('Firestore saveGame failed:', e);
      throw e;
    }
  },

  deleteGame: async (gameId: string): Promise<void> => {
    const cached = getSafeCached<GameItem[]>('games') || [];
    const filtered = cached.filter(g => g.id !== gameId);
    setSafeCached('games', filtered);

    try {
      const docRef = doc(db, 'games', gameId);
      await withTimeout(deleteDoc(docRef), 6000);
    } catch (e) {
      console.warn('Firestore deleteGame failed:', e);
      throw e;
    }
  },

  getDefaultGamesList: (): GameItem[] => {
    return getDefaultGames();
  },

  getDefaultClassesList: (): ClassItem[] => {
    return DEFAULT_CLASSES;
  },

  getDefaultStudentsList: (): StudentItem[] => {
    return DEFAULT_STUDENTS;
  },

  // --- CLASSES CRUD (Instant SWR Cache) ---
  getClasses: async (): Promise<ClassItem[]> => {
    // 1. Instant cache return (<1ms)
    const cached = getSafeCached<ClassItem[]>('classes');
    const isInit = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}classes_init`);
    if (cached && (cached.length > 0 || isInit === 'true')) {
      setTimeout(() => {
        firestoreService.fetchRemoteClasses().catch(() => {});
      }, 50);
      return cached;
    }

    // 2. Fetch remote if no cache
    try {
      const remote = await firestoreService.fetchRemoteClasses();
      if (remote && remote.length > 0) return remote;
    } catch {}

    // 3. Default fallback
    setSafeCached('classes', DEFAULT_CLASSES);
    firestoreService.syncLocalClassesToCloud(DEFAULT_CLASSES).catch(() => {});
    return DEFAULT_CLASSES;
  },

  syncLocalClassesToCloud: async (classesToSync?: ClassItem[]): Promise<void> => {
    try {
      const clsList = classesToSync || (await firestoreService.getClasses());
      for (const c of clsList) {
        const docRef = doc(db, 'classes', c.id || c.name);
        await setDoc(docRef, c, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Background syncLocalClassesToCloud error:', e);
    }
  },

  fetchRemoteClasses: async (): Promise<ClassItem[]> => {
    const colRef = collection(db, 'classes');
    const snap = await withTimeout(getDocs(colRef), 3500);
    if (!snap.empty) {
      const classMap = new Map<string, ClassItem>();
      snap.forEach(docSnap => {
        const item = docSnap.data() as ClassItem;
        const key = (item.name || item.id || docSnap.id).trim().toUpperCase();
        if (key && !classMap.has(key)) {
          classMap.set(key, {
            id: item.id || docSnap.id || key,
            name: item.name || key,
            isActive: item.isActive !== false,
            studentCount: Number(item.studentCount || 0),
            description: item.description || ''
          });
        }
      });
      const classes = Array.from(classMap.values());
      classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setSafeCached('classes', classes);
      return classes;
    }
    return [];
  },

  saveClass: async (classItem: ClassItem): Promise<void> => {
    // 1. Immediately update local storage
    try {
      const list = getSafeCached<ClassItem[]>('classes') || [...DEFAULT_CLASSES];
      const cleanKey = (classItem.name || classItem.id).trim().toUpperCase();
      const index = list.findIndex(c => (c.id || '').toUpperCase() === cleanKey || (c.name || '').toUpperCase() === cleanKey);
      if (index >= 0) {
        list[index] = classItem;
      } else {
        list.push(classItem);
      }
      setSafeCached('classes', list);
    } catch {}

    // 2. Save to Firestore
    try {
      const docRef = doc(db, 'classes', classItem.id);
      await withTimeout(setDoc(docRef, classItem, { merge: true }), 8000);
    } catch (e) {
      console.warn('Firestore saveClass warning:', e);
    }
  },

  deleteClass: async (classId: string): Promise<void> => {
    const cleanKey = classId.trim().toUpperCase();
    
    // 1. Immediately update local storage cache
    try {
      const list = getSafeCached<ClassItem[]>('classes') || [];
      const filtered = list.filter(c => 
        (c.id || '').toUpperCase() !== cleanKey && 
        (c.name || '').toUpperCase() !== cleanKey
      );
      setSafeCached('classes', filtered);
    } catch (e) {
      console.warn('Local cache deleteClass error:', e);
    }

    // 2. Delete from Firestore asynchronously
    try {
      const docRef = doc(db, 'classes', classId);
      await withTimeout(deleteDoc(docRef), 6000).catch(() => {});
      if (classId !== cleanKey) {
        const upperDocRef = doc(db, 'classes', cleanKey);
        await deleteDoc(upperDocRef).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore deleteClass docRef warning:', e);
    }
  },

  // --- STUDENTS & LOGINS CRUD (Instant SWR Cache) ---
  getStudents: async (userClass?: string): Promise<StudentItem[]> => {
    // 1. Instant cache return (<1ms)
    const cached = getSafeCached<StudentItem[]>('students');
    if (cached && Array.isArray(cached)) {
      setTimeout(() => {
        firestoreService.fetchRemoteStudents().catch(() => {});
      }, 50);
      if (userClass) return cached.filter(s => s.userClass && s.userClass.toUpperCase() === userClass.toUpperCase());
      return cached;
    }

    // 2. Fetch remote if no cache
    try {
      const remote = await firestoreService.fetchRemoteStudents();
      if (userClass) return remote.filter(s => s.userClass && s.userClass.toUpperCase() === userClass.toUpperCase());
      return remote;
    } catch {}

    return [];
  },

  fetchRemoteStudents: async (): Promise<StudentItem[]> => {
    const colRef = collection(db, 'students');
    const snap = await withTimeout(getDocs(colRef), 3500);
    if (!snap.empty) {
      const students: StudentItem[] = [];
      snap.forEach(docSnap => {
        students.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      students.sort((a, b) => a.name.localeCompare(b.name));
      setSafeCached('students', students);
      return students;
    }
    return [];
  },

  saveStudent: async (student: Partial<StudentItem> & { name: string; userClass: string }): Promise<string> => {
    const id = student.id || `std_${student.name.toLowerCase().replace(/\s+/g, '_')}_${student.userClass}`;
    const payload: StudentItem = {
      id,
      name: student.name,
      userClass: student.userClass,
      nisn: student.nisn || '',
      status: student.status || 'Aktif',
      lastLogin: student.lastLogin || new Date().toLocaleString('id-ID'),
      lastModule: student.lastModule || 1,
      completedModules: student.completedModules || [],
      createdAt: student.createdAt || new Date().toISOString()
    };

    // Instant local cache update
    const cached = getSafeCached<StudentItem[]>('students') || [];
    const index = cached.findIndex(s => s.id === id);
    if (index >= 0) {
      cached[index] = { ...cached[index], ...payload };
    } else {
      cached.push(payload);
    }
    setSafeCached('students', cached);

    // Save to Firestore
    try {
      const docRef = doc(db, 'students', id);
      await withTimeout(setDoc(docRef, payload, { merge: true }), 8000);
    } catch (e) {
      console.warn('Firestore saveStudent failed:', e);
    }

    return id;
  },

  deleteStudent: async (studentId: string): Promise<void> => {
    const cached = getSafeCached<StudentItem[]>('students') || [];
    const filtered = cached.filter(s => s.id !== studentId);
    setSafeCached('students', filtered);

    try {
      const docRef = doc(db, 'students', studentId);
      await withTimeout(deleteDoc(docRef), 6000);
    } catch (e) {
      console.warn('Firestore deleteStudent failed:', e);
    }
  },

  // Record login event (without auto-creating unregistered students)
  recordStudentLogin: async (name: string, userClass: string): Promise<void> => {
    const timestamp = new Date().toLocaleString('id-ID');
    
    // Only update lastLogin if student is already registered
    try {
      const allStudents = await firestoreService.getStudents();
      const existing = allStudents.find(s => 
        s.name.trim().toUpperCase() === name.trim().toUpperCase() &&
        s.userClass.trim().toUpperCase() === userClass.trim().toUpperCase()
      );
      if (existing) {
        const docRef = doc(db, 'students', existing.id);
        withTimeout(setDoc(docRef, { lastLogin: timestamp }, { merge: true }), 4000).catch(() => {});
      }
    } catch (err) {
      console.warn('Update student lastLogin note:', err);
    }

    firestoreService.addActivityLog({
      username: name,
      userClass,
      action: 'LOGIN',
      details: `Siswa login ke aplikasi pada ${timestamp}`,
      timestamp
    }).catch(() => {});
  },

  // --- SCORES / NILAI CRUD (Instant SWR Cache) ---
  getScores: async (filterClass?: string): Promise<ScoreRecord[]> => {
    // 1. Instant cache return (<1ms)
    const cached = getSafeCached<ScoreRecord[]>('scores');
    if (cached && Array.isArray(cached)) {
      setTimeout(() => {
        firestoreService.fetchRemoteScores().catch(() => {});
      }, 50);
      if (filterClass) return cached.filter(s => s.userClass === filterClass);
      return cached;
    }

    // 2. Fetch remote
    try {
      const remote = await firestoreService.fetchRemoteScores();
      if (filterClass) return remote.filter(s => s.userClass === filterClass);
      return remote;
    } catch {}

    return [];
  },

  fetchRemoteScores: async (): Promise<ScoreRecord[]> => {
    const colRef = collection(db, 'scores');
    const snap = await withTimeout(getDocs(colRef), 3500);
    if (!snap.empty) {
      const scores: ScoreRecord[] = [];
      snap.forEach(docSnap => {
        scores.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      scores.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSafeCached('scores', scores);
      return scores;
    }
    return [];
  },

  saveScore: async (scoreData: Omit<ScoreRecord, 'id'>): Promise<string> => {
    const id = `score_${Date.now()}_${scoreData.username.replace(/\s+/g, '_')}`;
    const payload: ScoreRecord = {
      ...scoreData,
      id,
      timestamp: scoreData.timestamp || Date.now()
    };

    // 1. Save to local cache immediately
    const cached = getSafeCached<ScoreRecord[]>('scores') || [];
    cached.unshift(payload);
    setSafeCached('scores', cached.slice(0, 500));

    // 2. Save to Firestore asynchronously
    try {
      const docRef = doc(db, 'scores', id);
      withTimeout(setDoc(docRef, payload), 8000).catch(err => {
        console.warn('Firestore async saveScore error:', err);
      });
    } catch (e) {
      console.warn('Firestore saveScore failed:', e);
    }

    // Also record activity log
    firestoreService.addActivityLog({
      username: scoreData.username,
      userClass: scoreData.userClass,
      action: 'SELESAI_KUIS',
      details: `Menyelesaikan ${scoreData.quizTitle} dengan nilai ${scoreData.score}/${scoreData.totalQuestions} (${scoreData.percentage}%)`,
      timestamp: scoreData.date
    }).catch(() => {});

    return id;
  },

  deleteScore: async (scoreId: string): Promise<void> => {
    const cached = getSafeCached<ScoreRecord[]>('scores') || [];
    const filtered = cached.filter(s => s.id !== scoreId);
    setSafeCached('scores', filtered);

    try {
      const docRef = doc(db, 'scores', scoreId);
      await withTimeout(deleteDoc(docRef), 6000);
    } catch (e) {
      console.warn('Firestore deleteScore failed:', e);
    }
  },

  // --- ACTIVITY LOGS (Instant SWR Cache) ---
  getActivityLogs: async (limitCount = 100): Promise<ActivityLog[]> => {
    const cached = getSafeCached<ActivityLog[]>('activity_logs');
    if (cached && Array.isArray(cached)) {
      setTimeout(() => {
        firestoreService.fetchRemoteActivityLogs(limitCount).catch(() => {});
      }, 50);
      return cached.slice(0, limitCount);
    }

    try {
      const remote = await firestoreService.fetchRemoteActivityLogs(limitCount);
      return remote;
    } catch {}

    return [];
  },

  fetchRemoteActivityLogs: async (limitCount = 100): Promise<ActivityLog[]> => {
    const colRef = collection(db, 'activity_logs');
    const snap = await withTimeout(getDocs(colRef), 3500);
    if (!snap.empty) {
      const logs: ActivityLog[] = [];
      snap.forEach(docSnap => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      const sliced = logs.slice(0, limitCount);
      setSafeCached('activity_logs', sliced);
      return sliced;
    }
    return [];
  },

  addActivityLog: async (log: Omit<ActivityLog, 'id'>): Promise<void> => {
    const id = `log_${Date.now()}`;
    const payload: ActivityLog = { ...log, id };
    
    // Instant local cache update
    const cached = getSafeCached<ActivityLog[]>('activity_logs') || [];
    cached.unshift(payload);
    setSafeCached('activity_logs', cached.slice(0, 100));

    try {
      const docRef = doc(db, 'activity_logs', id);
      withTimeout(setDoc(docRef, payload), 6000).catch(() => {});
    } catch (e) {
      console.warn('Firestore addActivityLog failed:', e);
    }
  },

  // --- APP SETTINGS (Instant SWR Cache) ---
  getSettings: async (): Promise<AppSettings> => {
    const cached = getSafeCached<AppSettings>('settings');
    if (cached) {
      if (cached.googleAppsScriptUrl && cached.googleAppsScriptUrl.includes('AKfycbzLsyFBV2ntaJiXODGepHSTCfubPWmRdIO27iuXwbgVEA3Cs1vMw5c0F1KuOcd_A2NEsw')) {
        cached.googleAppsScriptUrl = DEFAULT_SETTINGS.googleAppsScriptUrl;
        cached.sheetUrl = DEFAULT_SETTINGS.sheetUrl;
        cached.sheetId = DEFAULT_SETTINGS.sheetId;
        setSafeCached('settings', cached);
      }
      setTimeout(() => {
        firestoreService.fetchRemoteSettings().catch(() => {});
      }, 50);
      return cached;
    }

    try {
      const remote = await firestoreService.fetchRemoteSettings();
      if (remote) return remote;
    } catch {}

    return DEFAULT_SETTINGS;
  },

  fetchRemoteSettings: async (): Promise<AppSettings | null> => {
    const docRef = doc(db, 'settings', 'general');
    const snap = await withTimeout(getDoc(docRef), 3000);
    if (snap.exists()) {
      const settings = snap.data() as AppSettings;
      if (settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.includes('AKfycbzLsyFBV2ntaJiXODGepHSTCfubPWmRdIO27iuXwbgVEA3Cs1vMw5c0F1KuOcd_A2NEsw')) {
        settings.googleAppsScriptUrl = DEFAULT_SETTINGS.googleAppsScriptUrl;
        settings.sheetUrl = DEFAULT_SETTINGS.sheetUrl;
        settings.sheetId = DEFAULT_SETTINGS.sheetId;
        firestoreService.saveSettings(settings).catch(() => {});
      }
      setSafeCached('settings', settings);
      return settings;
    }
    return null;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    // 1. Save to local storage first (instant responsiveness 0ms)
    setSafeCached('settings', settings);
    
    // 2. Clean payload to avoid undefined fields
    const cleanSettings = JSON.parse(JSON.stringify(settings));

    // 3. Save to Firestore with resilient background sync
    try {
      const docRef = doc(db, 'settings', 'general');
      await withTimeout(setDoc(docRef, cleanSettings, { merge: true }), 10000);
    } catch (e) {
      console.warn('Firestore saveSettings background sync note:', e);
    }
  },

  // --- SYNC ALL CURRENT APP DATA TO CLOUD (PARALLEL & RESILIENT) ---
  syncAllCurrentDataToCloud: async (
    customModules?: AppModule[],
    customQuizzes?: QuizConfig[],
    customGames?: GameItem[],
    customClasses?: ClassItem[],
    customSettings?: AppSettings,
    onProgress?: (step: string, percent: number) => void
  ): Promise<{ success: boolean; message: string }> => {
    try {
      onProgress?.('Mempersiapkan data modul...', 10);
      const mods = customModules || (await firestoreService.getModules());
      const gms = customGames || (await firestoreService.getGames());
      const qzs = customQuizzes || (await firestoreService.getQuizzes());
      const clsList = customClasses || (await firestoreService.getClasses());
      const st = customSettings || (await firestoreService.getSettings());

      // 1. Sync Games in parallel
      onProgress?.('Menyinkronkan bank game...', 25);
      const gamePromises = gms.map(async (gm) => {
        try {
          const docRef = doc(db, 'games', gm.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(gm)), { merge: true });
        } catch (e) {
          console.warn('Sync game item warning:', e);
        }
      });
      await Promise.allSettled(gamePromises);

      // 2. Sync Modules in parallel
      onProgress?.('Menyimpan seluruh modul materi...', 50);
      const modPromises = mods.map(async (mod) => {
        try {
          const updatedPages = hydrateModulePages(mod.pages || [], gms);
          const cleanMod: AppModule = { ...mod, pages: updatedPages };
          const docRef = doc(db, 'modules', `mod_${cleanMod.id}`);
          await setDoc(docRef, JSON.parse(JSON.stringify(cleanMod)), { merge: true });
        } catch (e) {
          console.warn('Sync module item warning:', e);
        }
      });
      await Promise.allSettled(modPromises);

      // 3. Sync Quizzes in parallel
      onProgress?.('Menyimpan bank kuis...', 75);
      const quizPromises = qzs.map(async (qz) => {
        try {
          const docRef = doc(db, 'quizzes', `quiz_${qz.moduleNumber}`);
          await setDoc(docRef, JSON.parse(JSON.stringify(qz)), { merge: true });
        } catch (e) {
          console.warn('Sync quiz item warning:', e);
        }
      });
      await Promise.allSettled(quizPromises);

      // 4. Sync Classes & Settings
      onProgress?.('Menyimpan data kelas dan konfigurasi...', 90);
      const classPromises = clsList.map(async (cls) => {
        try {
          const docRef = doc(db, 'classes', cls.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(cls)), { merge: true });
        } catch {}
      });
      await Promise.allSettled(classPromises);

      try {
        const settingsRef = doc(db, 'settings', 'general');
        await setDoc(settingsRef, JSON.parse(JSON.stringify(st)), { merge: true });
      } catch {}

      onProgress?.('Sinkronisasi selesai!', 100);
      return {
        success: true,
        message: `Berhasil menyinkronkan ${mods.length} Modul, ${qzs.length} Kuis, ${gms.length} Game Edukasi, dan ${clsList.length} Kelas ke Firebase Cloud!`
      };
    } catch (error: any) {
      console.error('syncAllCurrentDataToCloud error:', error);
      return {
        success: false,
        message: `Gagal sinkronisasi: ${error?.message || 'Koneksi jaringan'}`
      };
    }
  },

  // --- SEED INITIAL DATA TO FIRESTORE (1-CLICK) ---
  seedInitialData: async (onProgress?: (step: string, percent: number) => void): Promise<{ success: boolean; message: string }> => {
    try {
      onProgress?.('Mempersiapkan data modul...', 10);
      const defaultModules = getDefaultModules();
      for (let i = 0; i < defaultModules.length; i++) {
        const mod = defaultModules[i];
        onProgress?.(`Menyimpan Modul ${mod.id}: ${mod.subtitle}...`, 10 + Math.round((i / defaultModules.length) * 35));
        await firestoreService.saveModule(mod);
      }

      onProgress?.('Menyimpan bank kuis ke Firestore...', 50);
      const defaultQuizzes = getDefaultQuizzes();
      for (let i = 0; i < defaultQuizzes.length; i++) {
        const qz = defaultQuizzes[i];
        onProgress?.(`Menyimpan Kuis Modul ${qz.moduleNumber}...`, 50 + Math.round((i / defaultQuizzes.length) * 25));
        await firestoreService.saveQuiz(qz);
      }

      onProgress?.('Menyiapkan daftar kelas...', 75);
      for (const cls of DEFAULT_CLASSES) {
        await firestoreService.saveClass(cls);
      }

      onProgress?.('Menyinkronkan bank game edukasi ke Firestore...', 85);
      const defaultGames = getDefaultGames();
      for (let i = 0; i < defaultGames.length; i++) {
        const gm = defaultGames[i];
        onProgress?.(`Menyimpan Game: ${gm.title}...`, 85 + Math.round((i / defaultGames.length) * 10));
        await firestoreService.saveGame(gm);
      }

      onProgress?.('Menyimpan konfigurasi umum...', 95);
      await firestoreService.saveSettings(DEFAULT_SETTINGS);

      onProgress?.('Selesai!', 100);
      return { 
        success: true, 
        message: `Berhasil menginisialisasi ${defaultModules.length} Modul, ${defaultQuizzes.length} Kuis, ${defaultGames.length} Game Edukasi, dan ${DEFAULT_CLASSES.length} Kelas ke Firebase Firestore!` 
      };
    } catch (error: any) {
      console.error('Seed initial data error:', error);
      return { 
        success: false, 
        message: `Gagal inisialisasi ke Firebase: ${error?.message || 'Error tidak diketahui'}` 
      };
    }
  }
};
