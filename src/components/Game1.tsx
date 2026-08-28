import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Play, RotateCw } from 'lucide-react';

interface Card {
  pairId: number;
  name: string;
  emoji?: string;
  imageUrl?: string;
  color?: string;
  uniqueId: string;
}

const ITEMS = [
  { name: 'Tomat', emoji: '🍅', color: 'bg-red-50' },
  { name: 'Cabai', emoji: '🌶️', color: 'bg-red-50' },
  { name: 'Sawi', emoji: '🥬', color: 'bg-green-50' },
  { name: 'Wortel', emoji: '🥕', color: 'bg-orange-50' },
  { name: 'Jagung', emoji: '🌽', color: 'bg-yellow-50' },
  { name: 'Terong', emoji: '🍆', color: 'bg-purple-50' },
  { name: 'Timun', emoji: '🥒', color: 'bg-green-50' },
  { name: 'Kentang', emoji: '🥔', color: 'bg-amber-50' },
  { name: 'Semangka', emoji: '🍉', color: 'bg-red-50' },
  { name: 'Bayam', emoji: '🥗', color: 'bg-green-50' },
  { name: 'Brokoli', emoji: '🥦', color: 'bg-emerald-50' },
  { name: 'Strawberry', emoji: '🍓', color: 'bg-pink-50' },
  { name: 'Anggur', emoji: '🍇', color: 'bg-purple-50' },
  { name: 'Pisang', emoji: '🍌', color: 'bg-yellow-50' },
  { name: 'Apel', emoji: '🍎', color: 'bg-red-50' },
  { name: 'Jeruk', emoji: '🍊', color: 'bg-orange-50' },
  { name: 'Nanas', emoji: '🍍', color: 'bg-yellow-50' },
  { name: 'Mangga', emoji: '🥭', color: 'bg-orange-50' },
  { name: 'Lemon', emoji: '🍋', color: 'bg-yellow-50' },
  { name: 'Manggis', emoji: '🟣', color: 'bg-purple-50' },
  { name: 'Alpukat', emoji: '🥑', color: 'bg-green-50' },
  { name: 'Melon', emoji: '🍈', color: 'bg-green-50' },
  { name: 'Jamur', emoji: '🍄', color: 'bg-stone-50' },
  { name: 'Paprika', emoji: '🫑', color: 'bg-red-50' },
];

const LEVEL_CONFIG: Record<number, { pairs: number; title: string }> = {
  1: { pairs: 2, title: 'Level 1: Dasar' },
  2: { pairs: 3, title: 'Level 2: Pemula' },
  3: { pairs: 4, title: 'Level 3: Menengah' },
  4: { pairs: 6, title: 'Level 4: Seru' },
  5: { pairs: 8, title: 'Level 5: Tantangan' },
  6: { pairs: 10, title: 'Level 6: Mahir' },
  7: { pairs: 12, title: 'Level 7: Ahli' },
  8: { pairs: 15, title: 'Level 8: Master' },
  9: { pairs: 18, title: 'Level 9: Legenda' },
  10: { pairs: 21, title: 'Level 10: Mitos' },
  11: { pairs: 24, title: 'Level 11: Dewa' },
};

interface Game1Props {
  customItems?: Array<{ name: string; emoji?: string; imageUrl?: string; color?: string }>;
  onGameComplete: (isFullComplete?: boolean) => void;
  onLevelChange?: (level: number) => void;
  searchQuery?: string;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const Game1: React.FC<Game1Props> = ({ customItems, onGameComplete, onLevelChange, searchQuery }) => {
  const [level, setLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [isGodMode, setIsGodMode] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [locked, setLocked] = useState(true);
  const [status, setStatus] = useState('Siap bermain?');
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const initGame = useCallback((lvl: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const maxPairs = LEVEL_CONFIG[lvl]?.pairs || 2;
    const baseItems = (customItems && customItems.length >= 2) ? customItems : ITEMS;
    const pairsCount = Math.min(maxPairs, baseItems.length);
    const itemPool = shuffle([...baseItems]);
    const selectedItems = itemPool.slice(0, pairsCount);
    
    const gameCards = selectedItems.flatMap((item, i) => [
      { ...item, pairId: i, uniqueId: `${i}-a` },
      { ...item, pairId: i, uniqueId: `${i}-b` },
    ]);
    
    setCards(shuffle(gameCards));
    setFlipped([]);
    setMatched([]);
    setLocked(true);
    setGameStarted(true);
    
    setStatus('Ingat-ingat posisinya!');
    setFlipped(gameCards.map((_, i) => i));

    let countdown = 3;
    if (lvl >= 4 && lvl <= 7) countdown = 5;
    else if (lvl >= 8 && lvl <= 9) countdown = 8;
    else if (lvl >= 10) countdown = 10;

    timerRef.current = setInterval(() => {
      if (countdown <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setFlipped([]);
        setStatus('Temukan pasangan gambar!');
        setLocked(false);
      } else {
        countdown--;
        setStatus(`Ingat-ingat posisinya! (${countdown})`);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (searchQuery?.toLowerCase() === 'xgame1') {
      setUnlockedLevels(11);
      setIsGodMode(true);
      setStatus('🏆 KAMU TIDAK ADA LAWAN!');
      setGameStarted(true);
      setLocked(true); // Lock interactions in god mode
      setCards([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (onLevelChange) onLevelChange(level);
  }, [level, onLevelChange]);

  const handleFlip = (idx: number) => {
    if (locked || flipped.includes(idx) || matched.includes(cards[idx].pairId)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      const [a, b] = newFlipped;
      
      if (cards[a].pairId === cards[b].pairId) {
        const newMatched = [...matched, cards[a].pairId];
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        
        if (newMatched.length === LEVEL_CONFIG[level].pairs) {
          if (level < 11) {
            setStatus('🎉 Hebat! Level ' + (level + 1));
            setUnlockedLevels(prev => Math.max(prev, level + 1));
            setTimeout(() => {
              setLevel(prev => prev + 1);
              initGame(level + 1);
            }, 1000);
          } else {
            setStatus('🏆 Juara! Semua Level Selesai!');
            // Only trigger completion on the final level
            onGameComplete(true);
          }
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[400px] mx-auto bg-emerald-900/60 backdrop-blur-xl p-2 md:p-3 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 shadow-2xl relative">
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <h2 className="text-xs md:text-sm font-black text-yellow-300 flex items-center gap-1">
          <span>🥕 Game Modul 1 🍓</span>
        </h2>
        <div className="text-[9px] md:text-[10px] font-bold text-white/90 bg-emerald-700/50 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tight">
          {LEVEL_CONFIG[level].title}
        </div>
      </div>

      <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div 
          className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${(matched.length / LEVEL_CONFIG[level].pairs) * 100}%` }}
        />
      </div>
      
      <div className="text-white text-[9px] md:text-[10px] font-bold mb-1.5 bg-white/10 px-4 py-0.5 rounded-full text-center min-h-[20px] flex items-center shadow-inner border border-white/5 uppercase tracking-wide">
        {status.includes('Ingat') ? 'INGAT POSISI!' : status}
      </div>

      <div className={`grid gap-1 md:gap-2 w-full justify-items-center ${
        level === 1 ? 'grid-cols-2 max-w-[160px]' : 
        level >= 10 ? 'grid-cols-6' :
        level >= 8 ? 'grid-cols-5' : 'grid-cols-4'
      }`}>
        {isGodMode ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
            <span className="text-6xl">👑</span>
            <div className="text-center">
              <h3 className="text-xl font-black text-yellow-300 mb-1">UNSTOPPABLE!</h3>
              <p className="text-sm font-bold text-white/60 uppercase tracking-widest leading-none">Kamu Tidak Ada Lawan</p>
            </div>
          </div>
        ) : cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(card.pairId);
          return (
            <div 
              key={idx} 
              onClick={() => handleFlip(idx)}
              className="w-full aspect-square cursor-pointer perspective-1000 max-w-[60px] relative"
            >
              <div className={`relative w-full h-full duration-500 transition-transform preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 border-2 border-emerald-500 rounded-xl flex items-center justify-center shadow-[0_4px_0_rgba(5,150,105,1)]">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-sm opacity-60">🌱</span>
                  </div>
                </div>
                <div className={`absolute inset-0 backface-hidden rotate-y-180 ${card.color || 'bg-emerald-50'} border-2 border-emerald-400 rounded-xl flex flex-col items-center justify-center shadow-[0_4px_0_rgba(16,185,129,0.5)] overflow-hidden transition-all p-1`}>
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain max-h-[36px] drop-shadow-xs"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.card-emoji-fallback') as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div className={`card-emoji-fallback text-2xl md:text-3xl leading-none transform transition-transform animate-bounce-short ${card.imageUrl ? 'hidden' : 'block'}`}>
                    {card.emoji || '🌱'}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 py-0.5">
                    <span className="text-[6px] md:text-[7px] font-black text-white uppercase text-center block leading-none tracking-tighter px-0.5 truncate">
                      {card.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!gameStarted && (
        <button 
          onClick={() => initGame(level)}
          className="mt-5 px-8 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-900 font-black rounded-full shadow-[0_4px_0_rgba(202,138,4,1)] transition-all flex items-center gap-2 active:translate-y-1 active:shadow-none text-xs uppercase"
        >
          <Play size={14} fill="currentColor" />
          <span>MULAI PETUALANGAN!</span>
        </button>
      )}

      {status === '🏆 Juara! Semua Level Selesai!' && (
        <button 
          onClick={() => {
            setLevel(1);
            initGame(1);
          }}
          className="mt-5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-full shadow-[0_4px_0_rgba(5,150,105,1)] transition-all flex items-center gap-2 active:translate-y-1 active:shadow-none text-xs uppercase"
        >
          <RefreshCw size={14} />
          <span>MAIN LAGI</span>
        </button>
      )}
      
      {gameStarted && (
        <div className="flex gap-4 mt-3">
          <button 
            onClick={() => initGame(level)}
            className="text-[8px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            <RotateCw size={10} />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Level Selector */}
      <div className="mt-4 w-full px-2 border-t border-white/10 pt-3">
        <p className="text-[8px] font-black text-white/40 uppercase mb-2 text-center tracking-widest">Pilih Level</p>
        <div className="grid grid-cols-6 md:grid-cols-11 gap-1.5 pb-2">
          {Object.keys(LEVEL_CONFIG).map((l) => {
            const num = parseInt(l);
            const isUnlocked = num <= unlockedLevels || isGodMode;
            const isActive = level === num;
            return (
              <button
                key={num}
                onClick={() => {
                  if (isUnlocked) {
                    setIsGodMode(false);
                    setLevel(num);
                    initGame(num);
                  }
                }}
                disabled={!isUnlocked}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all
                  ${isActive && !isGodMode
                    ? 'bg-yellow-400 text-emerald-900 scale-110 shadow-lg shadow-yellow-400/20' 
                    : isUnlocked 
                      ? 'bg-white/10 text-white/80 hover:bg-white/20' 
                      : 'bg-black/20 text-white/10 cursor-not-allowed opacity-40'
                  }
                  ${isGodMode ? 'border border-yellow-400/30' : 'border border-white/5'}
                `}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
