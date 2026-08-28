import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Plus,
  Trash2,
  Edit,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Code2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Info,
  X,
  RotateCcw,
  Cloud,
  Check,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
  PlusCircle,
  Copy,
  FolderArchive
} from 'lucide-react';
import { AppModule, GameItem, GameItemElement, ModulePage } from '../types';
import { CustomGameRenderer } from './CustomGameRenderer';
import { GAME_TEMPLATES, GameTemplate } from '../utils/gameTemplates';
import { compressImage } from '../utils/imageCompressor';
import { Game1 } from './Game1';
import { Game2 } from './Game2';
import { Game3 } from './Game3';
import { MemoryGame } from './MemoryGame';

interface AdminGameManagerProps {
  games: GameItem[];
  modules: AppModule[];
  onSaveGame: (game: GameItem) => Promise<void>;
  onDeleteGame: (gameId: string) => Promise<void>;
  onSyncAllGames: () => Promise<void>;
  onResetDefaultGames: () => Promise<void>;
  onEmbedGameToModule: (
    game: GameItem,
    moduleId: number,
    mode: 'new_page' | 'replace_page',
    pageId?: number
  ) => Promise<void>;
  isSyncing: boolean;
  showNotification: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminGameManager: React.FC<AdminGameManagerProps> = ({
  games,
  modules,
  onSaveGame,
  onDeleteGame,
  onSyncAllGames,
  onResetDefaultGames,
  onEmbedGameToModule,
  isSyncing,
  showNotification
}) => {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<'details' | 'assets' | 'code' | 'preview'>('details');
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Playtest Modal
  const [isPlaytestOpen, setIsPlaytestOpen] = useState<boolean>(false);
  const [playtestingGame, setPlaytestingGame] = useState<GameItem | null>(null);
  const [playtestScore, setPlaytestScore] = useState<number | null>(null);

  // Embed Modal
  const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);
  const [embedTargetGame, setEmbedTargetGame] = useState<GameItem | null>(null);
  const [embedModuleId, setEmbedModuleId] = useState<number>(modules[0]?.id || 1);
  const [embedMode, setEmbedMode] = useState<'new_page' | 'replace_page'>('new_page');
  const [embedPageId, setEmbedPageId] = useState<number | undefined>(undefined);
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);

  // Hidden File Input Ref
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = Array.from(
    new Set(games.map(g => g.category || 'Umum').filter(Boolean))
  );

  // Filtered games
  const filteredGames = games.filter(g => {
    const matchSearch =
      !searchQuery ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType =
      filterType === 'ALL'
        ? true
        : filterType === 'modular'
        ? g.type.startsWith('modular_') || g.type === 'memory'
        : g.type === filterType;

    const matchCat = filterCategory === 'ALL' || g.category === filterCategory;

    return matchSearch && matchType && matchCat;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    const newId = `custom_game_${Date.now()}`;
    const defaultTpl = GAME_TEMPLATES[0];
    setEditingGame({
      id: newId,
      title: 'Game Interaktif Baru',
      category: 'Kuis & Tantangan',
      type: 'custom_html',
      description: 'Game edukasi interaktif untuk memperdalam pemahaman konsep materi.',
      instructions: 'Ikuti instruksi yang tampil pada layar untuk menyelesaikan misi permainan.',
      passScore: 100,
      code: defaultTpl.code,
      items: [
        { name: 'Kangkung', emoji: '🌿', color: 'bg-green-50' },
        { name: 'Bayam', emoji: '🥬', color: 'bg-emerald-50' },
        { name: 'Sawi', emoji: '🥗', color: 'bg-green-100' },
        { name: 'Tomat', emoji: '🍅', color: 'bg-red-50' },
      ],
      isBuiltIn: false,
      createdAt: new Date().toISOString()
    });
    setEditorTab('details');
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (game: GameItem) => {
    setEditingGame(JSON.parse(JSON.stringify(game)));
    setEditorTab('details');
    setIsEditorOpen(true);
  };

  // Upload Icon to Firebase (Base64 WebP)
  const handleUploadGameIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingGame) return;
    try {
      setIsCompressing(true);
      const base64 = await compressImage(file, 220, 0.85);
      setEditingGame({ ...editingGame, iconUrl: base64 });
      showNotification('Ikon game berhasil diunggah dan disimpan ke database Firebase!', 'success');
    } catch (err: any) {
      showNotification(`Gagal mengunggah icon: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsCompressing(false);
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  // Upload Banner/Cover to Firebase
  const handleUploadGameBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingGame) return;
    try {
      setIsCompressing(true);
      const base64 = await compressImage(file, 650, 0.8);
      setEditingGame({ ...editingGame, imageUrl: base64 });
      showNotification('Banner sampul game berhasil diunggah dan disimpan ke Firebase!', 'success');
    } catch (err: any) {
      showNotification(`Gagal mengunggah banner: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsCompressing(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Upload Card Item Image
  const handleUploadItemImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingGame) return;
    try {
      setIsCompressing(true);
      const base64 = await compressImage(file, 200, 0.85);
      const currentItems = [...(editingGame.items || [])];
      if (currentItems[index]) {
        currentItems[index] = { ...currentItems[index], imageUrl: base64 };
        setEditingGame({ ...editingGame, items: currentItems });
        showNotification(`Gambar kartu "${currentItems[index].name}" berhasil disimpan ke Firebase!`, 'success');
      }
    } catch (err: any) {
      showNotification(`Gagal mengunggah gambar kartu: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  // Remove Card Item Image (revert to emoji)
  const handleRemoveItemImage = (index: number) => {
    if (!editingGame) return;
    const currentItems = [...(editingGame.items || [])];
    if (currentItems[index]) {
      const { imageUrl, ...rest } = currentItems[index];
      currentItems[index] = rest;
      setEditingGame({ ...editingGame, items: currentItems });
      showNotification('Gambar kartu dihapus, menggunakan emoji cadangan.', 'info');
    }
  };

  // Add Item Element
  const handleAddItem = () => {
    if (!editingGame) return;
    const currentItems = [...(editingGame.items || [])];
    currentItems.push({
      name: `Elemen ${currentItems.length + 1}`,
      emoji: '🌱',
      color: 'bg-emerald-50'
    });
    setEditingGame({ ...editingGame, items: currentItems });
  };

  // Delete Item Element
  const handleDeleteItem = (index: number) => {
    if (!editingGame) return;
    const currentItems = [...(editingGame.items || [])];
    currentItems.splice(index, 1);
    setEditingGame({ ...editingGame, items: currentItems });
  };

  // Update Item Element
  const handleUpdateItem = (index: number, patch: Partial<GameItemElement>) => {
    if (!editingGame) return;
    const currentItems = [...(editingGame.items || [])];
    if (currentItems[index]) {
      currentItems[index] = { ...currentItems[index], ...patch };
      setEditingGame({ ...editingGame, items: currentItems });
    }
  };

  // Preset loader
  const handleLoadPresetItems = (preset: 'sayur' | 'pangan' | 'rempah') => {
    if (!editingGame) return;
    let presetData: GameItemElement[] = [];
    if (preset === 'sayur') {
      presetData = [
        { name: 'Kangkung', emoji: '🌿', color: 'bg-green-50' },
        { name: 'Bayam', emoji: '🥬', color: 'bg-emerald-50' },
        { name: 'Sawi', emoji: '🥗', color: 'bg-green-100' },
        { name: 'Pakcoy', emoji: '🍃', color: 'bg-emerald-100' },
        { name: 'Tomat', emoji: '🍅', color: 'bg-red-50' },
        { name: 'Wortel', emoji: '🥕', color: 'bg-orange-50' },
        { name: 'Terong', emoji: '🍆', color: 'bg-purple-50' },
        { name: 'Timun', emoji: '🥒', color: 'bg-green-50' },
      ];
    } else if (preset === 'pangan') {
      presetData = [
        { name: 'Singkong', emoji: '🥔', color: 'bg-amber-50' },
        { name: 'Ubi Jalar', emoji: '🍠', color: 'bg-orange-50' },
        { name: 'Talas', emoji: '🟤', color: 'bg-stone-50' },
        { name: 'Pisang', emoji: '🍌', color: 'bg-yellow-50' },
        { name: 'Pepaya', emoji: '🍈', color: 'bg-orange-100' },
        { name: 'Jagung', emoji: '🌽', color: 'bg-yellow-50' },
        { name: 'Kacang Tanah', emoji: '🥜', color: 'bg-amber-100' },
        { name: 'Kedelai', emoji: '🫘', color: 'bg-yellow-100' },
      ];
    } else {
      presetData = [
        { name: 'Kunyit', emoji: '🧄', color: 'bg-yellow-100' },
        { name: 'Jahe', emoji: '🫚', color: 'bg-amber-100' },
        { name: 'Serai', emoji: '🌾', color: 'bg-green-50' },
        { name: 'Lengkuas', emoji: '🌿', color: 'bg-amber-50' },
        { name: 'Kencur', emoji: '🥔', color: 'bg-stone-100' },
        { name: 'Temulawak', emoji: '🟡', color: 'bg-yellow-50' },
        { name: 'Bawang Merah', emoji: '🧅', color: 'bg-purple-100' },
        { name: 'Bawang Putih', emoji: '🧄', color: 'bg-stone-50' },
      ];
    }
    setEditingGame({ ...editingGame, items: presetData });
    showNotification(`Preset "${preset.toUpperCase()}" (${presetData.length} item) berhasil dimuat!`, 'success');
  };

  // Apply Template
  const handleApplyTemplate = (tpl: GameTemplate) => {
    if (!editingGame) return;
    setEditingGame({
      ...editingGame,
      title: editingGame.title && editingGame.title !== 'Game Interaktif Baru' ? editingGame.title : tpl.name,
      category: tpl.category || editingGame.category,
      description: tpl.description || editingGame.description,
      type: tpl.type,
      code: tpl.code
    });
    showNotification(`Template "${tpl.name}" berhasil diterapkan ke editor!`, 'info');
  };

  // Save Game Handler
  const handleSave = async () => {
    if (!editingGame) return;
    if (!editingGame.title.trim()) {
      showNotification('Judul game wajib diisi!', 'error');
      return;
    }
    if ((editingGame.type === 'custom_html' || editingGame.type === 'custom_tsx') && !editingGame.code?.trim()) {
      showNotification('Kode HTML/TSX game tidak boleh kosong!', 'error');
      return;
    }

    try {
      await onSaveGame(editingGame);
      setIsEditorOpen(false);
      setEditingGame(null);
    } catch (err: any) {
      showNotification(`Gagal menyimpan game: ${err?.message || 'Error'}`, 'error');
    }
  };

  // Open Embed Modal
  const handleOpenEmbed = (game: GameItem) => {
    setEmbedTargetGame(game);
    const initialModId = modules.length > 0 ? modules[0].id : 1;
    setEmbedModuleId(initialModId);
    setEmbedMode('new_page');
    const firstMod = modules.find(m => m.id === initialModId);
    setEmbedPageId(firstMod?.pages?.[0]?.id);
    setIsEmbedOpen(true);
  };

  // Confirm Embed
  const handleConfirmEmbed = async () => {
    if (!embedTargetGame) return;
    setIsEmbedding(true);
    try {
      await onEmbedGameToModule(embedTargetGame, embedModuleId, embedMode, embedPageId);
      setIsEmbedOpen(false);
      setEmbedTargetGame(null);
    } finally {
      setIsEmbedding(false);
    }
  };

  // Open Playtest Modal
  const handleOpenPlaytest = (game: GameItem) => {
    setPlaytestingGame(game);
    setPlaytestScore(null);
    setIsPlaytestOpen(true);
  };

  const selectedModule = modules.find(m => m.id === embedModuleId);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ========================================================================= */}
      {/* TOP HEADER & ACTIONS                                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Kelola Game Edukasi</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {games.length} Game
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola game interaktif, aset gambar tersimpan di Firebase, dan sematkan ke materi modul.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Reset / Reload Defaults */}
          <button
            onClick={onResetDefaultGames}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
            title="Reset game bawaan"
          >
            <RotateCcw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>Reset Bawaan</span>
          </button>

          {/* Sync All to Cloud Firebase */}
          <button
            onClick={onSyncAllGames}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Sinkronkan game ke Firebase"
          >
            <Cloud size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Game'}</span>
          </button>

          {/* Add New Game */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Game</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATS OVERVIEW CARDS                                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-medium text-slate-500 block">Total Game</span>
          <span className="text-lg font-bold text-slate-900">{games.length}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-medium text-slate-500 block">HTML5 & JS</span>
          <span className="text-lg font-bold text-purple-700">
            {games.filter(g => g.type === 'custom_html').length}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-medium text-slate-500 block">React / TSX</span>
          <span className="text-lg font-bold text-indigo-700">
            {games.filter(g => g.type === 'custom_tsx').length}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-medium text-slate-500 block">Modular Bawaan</span>
          <span className="text-lg font-bold text-emerald-700">
            {games.filter(g => g.type.startsWith('modular_') || g.type === 'memory').length}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH & FILTERS BAR                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari game..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-purple-500 outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Filter Type */}
          <div className="flex items-center gap-1">
            <Filter size={12} className="text-slate-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white outline-hidden"
            >
              <option value="ALL">Semua Format</option>
              <option value="custom_html">HTML5 + JS</option>
              <option value="custom_tsx">React / TSX</option>
              <option value="modular">Modular Game</option>
            </select>
          </div>

          {/* Filter Category */}
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white outline-hidden"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          <span className="text-[11px] text-slate-400 font-mono pl-1">
            {filteredGames.length} Game
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GAMES GRID                                                                */}
      {/* ========================================================================= */}
      {filteredGames.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
          <Gamepad2 size={28} className="mx-auto text-slate-400" />
          <h4 className="text-xs font-bold text-slate-700">Belum Ada Game yang Sesuai</h4>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              + Tambah Game
            </button>
            <button
              onClick={onResetDefaultGames}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Reset Bawaan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredGames.map(game => {
            const isModular = game.type.startsWith('modular_') || game.type === 'memory';
            const isHtml = game.type === 'custom_html';
            const isTsx = game.type === 'custom_tsx';

            return (
              <div
                key={game.id}
                className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  {/* Category & Format Badges */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate">
                      {game.category || 'Edukasi'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        isHtml
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isTsx
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isHtml ? 'HTML5' : isTsx ? 'React TSX' : 'Modular'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                      <Gamepad2 size={14} className="text-purple-600 shrink-0" />
                      <span className="truncate">{game.title}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">
                      {game.description || 'Game interaktif siap disematkan ke modul.'}
                    </p>
                  </div>

                  {/* Meta: Pass Score */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Target: <strong className="text-slate-700">{isModular ? 'Level 4+' : `${game.passScore || 100} Poin`}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {game.code ? `${game.code.length} Karakter` : 'Bawaan'}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Play / Test Button */}
                    <button
                      onClick={() => handleOpenPlaytest(game)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Play size={12} />
                      <span>Uji Coba</span>
                    </button>

                    {/* Embed to Material */}
                    <button
                      onClick={() => handleOpenEmbed(game)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      <BookOpen size={12} />
                      <span>Sematkan</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    {/* Edit Game */}
                    <button
                      onClick={() => handleOpenEdit(game)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-purple-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Game */}
                    <button
                      onClick={() => onDeleteGame(game.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                      title="Hapus game"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GAME EDITOR (TAMBAH / EDIT KODE GAME)                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditorOpen && editingGame && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-xl flex flex-col max-h-[92vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Gamepad2 size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingGame.id.startsWith('custom_game_') && !editingGame.createdAt ? 'Tambah Game Baru' : 'Edit Game'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-5 gap-1 overflow-x-auto">
                <button
                  onClick={() => setEditorTab('details')}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    editorTab === 'details'
                      ? 'border-purple-600 text-purple-700 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Informasi
                </button>
                <button
                  onClick={() => setEditorTab('assets')}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    editorTab === 'assets'
                      ? 'border-purple-600 text-purple-700 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon size={13} className="text-purple-600" />
                  <span>Aset & Gambar</span>
                  {editingGame.items && editingGame.items.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full text-[10px]">
                      {editingGame.items.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setEditorTab('code')}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    editorTab === 'code'
                      ? 'border-purple-600 text-purple-700 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kode Game
                </button>
                <button
                  onClick={() => setEditorTab('preview')}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    editorTab === 'preview'
                      ? 'border-purple-600 text-purple-700 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pratinjau
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
                {/* TAB 1: INFORMASI & FORMAT */}
                {editorTab === 'details' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Judul Game</label>
                        <input
                          type="text"
                          value={editingGame.title}
                          onChange={e => setEditingGame({ ...editingGame, title: e.target.value })}
                          placeholder="Judul game..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:border-purple-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                        <input
                          type="text"
                          value={editingGame.category || ''}
                          onChange={e => setEditingGame({ ...editingGame, category: e.target.value })}
                          placeholder="Kategori game..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-purple-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Format Tipe</label>
                        <select
                          value={editingGame.type}
                          onChange={e =>
                            setEditingGame({
                              ...editingGame,
                              type: e.target.value as any
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white outline-hidden"
                        >
                          <option value="custom_html">HTML5 + JS</option>
                          <option value="custom_tsx">React Component (TSX)</option>
                          <option value="modular_game1">Game 1: Tebak Sayuran</option>
                          <option value="modular_game2">Game 2: Tanaman Pangan</option>
                          <option value="modular_game3">Game 3: Bumbu & Rimpang</option>
                          <option value="memory">Game 4: Memori Berkebun</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Skor Kelulusan</label>
                        <input
                          type="number"
                          value={editingGame.passScore || 100}
                          onChange={e =>
                            setEditingGame({
                              ...editingGame,
                              passScore: parseInt(e.target.value) || 100
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:bg-white outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Deskripsi</label>
                      <textarea
                        rows={2}
                        value={editingGame.description || ''}
                        onChange={e => setEditingGame({ ...editingGame, description: e.target.value })}
                        placeholder="Deskripsi singkat game..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Petunjuk Permainan</label>
                      <textarea
                        rows={2}
                        value={editingGame.instructions || ''}
                        onChange={e => setEditingGame({ ...editingGame, instructions: e.target.value })}
                        placeholder="Instruksi untuk siswa..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white outline-hidden"
                      />
                    </div>

                    {/* Template Quick Loader */}
                    <div className="bg-purple-50/40 border border-purple-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-900 text-xs flex items-center gap-1">
                          <Sparkles size={13} className="text-purple-600" />
                          <span>Template Game Bawaan</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {GAME_TEMPLATES.map(tpl => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleApplyTemplate(tpl)}
                            className="p-2 rounded-md bg-white border border-purple-200 hover:border-purple-400 text-left transition-all flex flex-col cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 text-[11px]">{tpl.name}</span>
                            <span className="text-[10px] text-slate-500 truncate">{tpl.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ASET & GAMBAR FIREBASE */}
                {editorTab === 'assets' && (
                  <div className="space-y-4">
                    {/* Section 1: Game Icon & Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Game Icon Box */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-800 text-xs">Ikon Game</label>
                          {editingGame.iconUrl && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-semibold">
                              ✓ Firebase
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {editingGame.iconUrl ? (
                              <img
                                src={editingGame.iconUrl}
                                alt="Icon Game"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">🎮</span>
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <input
                              type="file"
                              ref={iconInputRef}
                              accept="image/*"
                              onChange={handleUploadGameIcon}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => iconInputRef.current?.click()}
                              disabled={isCompressing}
                              className="w-full py-1 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Upload size={12} />
                              <span>{isCompressing ? 'Memproses...' : 'Unggah Ikon'}</span>
                            </button>

                            {editingGame.iconUrl && (
                              <button
                                type="button"
                                onClick={() => setEditingGame({ ...editingGame, iconUrl: undefined })}
                                className="w-full text-center text-[10px] text-red-600 hover:underline cursor-pointer"
                              >
                                Hapus Ikon
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Preset Emoji Picker */}
                        <div className="pt-1.5 border-t border-slate-200">
                          <span className="text-[10px] text-slate-500 block mb-1">Ikon Cepat:</span>
                          <div className="flex flex-wrap gap-1">
                            {['🎮', '🧠', '🍅', '🌱', '🏆', '🌟', '🎯', '🚀', '💡', '🧩', '📚', '🔬'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setEditingGame({ ...editingGame, iconUrl: undefined })}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:border-purple-400 flex items-center justify-center text-xs cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Game Banner Box */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-800 text-xs">Banner Sampul (Opsional)</label>
                        </div>

                        <div className="space-y-1.5">
                          <div className="w-full h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                            {editingGame.imageUrl ? (
                              <img
                                src={editingGame.imageUrl}
                                alt="Banner Game"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-slate-400 text-[11px]">Belum ada banner</span>
                            )}
                          </div>

                          <input
                            type="file"
                            ref={bannerInputRef}
                            accept="image/*"
                            onChange={handleUploadGameBanner}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={isCompressing}
                            className="w-full py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Upload size={12} />
                            <span>Unggah Banner</span>
                          </button>

                          {editingGame.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setEditingGame({ ...editingGame, imageUrl: undefined })}
                              className="w-full text-center text-[10px] text-red-600 hover:underline cursor-pointer"
                            >
                              Hapus Banner
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Card Items / Game Elements Manager */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                            <FolderArchive size={13} className="text-purple-600" />
                            <span>Elemen / Kartu Permainan ({editingGame.items?.length || 0})</span>
                          </h4>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-semibold">Preset:</span>
                          <button
                            type="button"
                            onClick={() => handleLoadPresetItems('sayur')}
                            className="px-2 py-0.5 bg-white hover:bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            🥬 Sayuran
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadPresetItems('pangan')}
                            className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            🥔 Pangan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadPresetItems('rempah')}
                            className="px-2 py-0.5 bg-white hover:bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            🧄 Rempah
                          </button>
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus size={10} />
                            <span>Tambah Baris</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Grid/List */}
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {(!editingGame.items || editingGame.items.length === 0) ? (
                          <div className="p-4 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-500 space-y-1">
                            <p className="text-[11px]">Belum ada elemen kartu permainan.</p>
                            <button
                              type="button"
                              onClick={() => handleLoadPresetItems('sayur')}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold text-[11px] cursor-pointer"
                            >
                              Muat Preset Sayuran
                            </button>
                          </div>
                        ) : (
                          editingGame.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                            >
                              {/* Left: Thumbnail & Emoji Fallback */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  ) : (
                                    <span className="text-sm">{item.emoji || '🌱'}</span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={e => handleUpdateItem(idx, { name: e.target.value })}
                                    placeholder="Nama Elemen"
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white outline-hidden"
                                  />
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={item.emoji || ''}
                                      onChange={e => handleUpdateItem(idx, { emoji: e.target.value })}
                                      placeholder="Emoji"
                                      className="w-12 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs focus:bg-white outline-hidden"
                                    />
                                    <span className="text-[10px] text-slate-400 truncate">
                                      {item.imageUrl ? '✓ Firebase' : 'Emoji'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Upload image / Delete actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <label className="cursor-pointer py-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold flex items-center gap-0.5">
                                  <Upload size={10} />
                                  <span>{item.imageUrl ? 'Ganti' : 'Upload'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleUploadItemImage(idx, e)}
                                    className="hidden"
                                  />
                                </label>

                                {item.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemImage(idx)}
                                    title="Hapus foto (kembali ke emoji)"
                                    className="p-1 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                                  >
                                    <RotateCcw size={11} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(idx)}
                                  title="Hapus elemen"
                                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: EDITOR KODE GAME */}
                {editorTab === 'code' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-3 py-1.5 rounded-t-lg text-xs">
                      <span className="font-mono font-bold text-amber-300">
                        {editingGame.type === 'custom_tsx' ? 'GameComponent.tsx' : 'index.html'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        window.parent.postMessage({`{ type: 'GAME_COMPLETE', score: 100 }`}, '*')
                      </span>
                    </div>

                    <textarea
                      rows={16}
                      value={editingGame.code || ''}
                      onChange={e => setEditingGame({ ...editingGame, code: e.target.value })}
                      placeholder="Kode HTML/JavaScript atau React TSX..."
                      className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed rounded-b-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-inner"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* TAB 4: PRATINJAU LANGSUNG */}
                {editorTab === 'preview' && (
                  <div className="space-y-2">
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-900">
                      {editingGame.type.startsWith('modular_') || editingGame.type === 'memory' ? (
                        <div className="p-3 bg-slate-800">
                          {editingGame.type === 'modular_game1' ? (
                            <Game1
                              customItems={editingGame.items}
                              onGameComplete={() => showNotification('Game 1 Selesai!', 'success')}
                            />
                          ) : editingGame.type === 'modular_game2' ? (
                            <Game2
                              customItems={editingGame.items}
                              onGameComplete={() => showNotification('Game 2 Selesai!', 'success')}
                            />
                          ) : editingGame.type === 'modular_game3' ? (
                            <Game3
                              customItems={editingGame.items}
                              onGameComplete={() => showNotification('Game 3 Selesai!', 'success')}
                            />
                          ) : (
                            <MemoryGame
                              customItems={editingGame.items}
                              onLevelComplete={() => showNotification('Level Memori Selesai!', 'success')}
                            />
                          )}
                        </div>
                      ) : (
                        <CustomGameRenderer
                          code={editingGame.code || ''}
                          gameType={editingGame.type === 'custom_tsx' ? 'custom_tsx' : 'custom_html'}
                          title={editingGame.title}
                          instructions={editingGame.instructions}
                          assets={editingGame.items}
                          onComplete={score =>
                            showNotification(
                              `Selesai! Skor: ${score || 100} poin.`,
                              'success'
                            )
                          }
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  {editorTab !== 'preview' && (
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-all"
                    >
                      Pratinjau
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Simpan Game</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: PLAYTEST GAME (LIVE PLAY DIALOG)                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPlaytestOpen && playtestingGame && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                    🎮
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      Uji Coba: {playtestingGame.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {playtestingGame.category || 'Mini Game Edukasi'} • Format: {playtestingGame.type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPlaytestOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950">
                {playtestingGame.type.startsWith('modular_') || playtestingGame.type === 'memory' ? (
                  <div className="p-2">
                    {playtestingGame.type === 'modular_game1' ? (
                      <Game1
                        onGameComplete={isFull => {
                          setPlaytestScore(100);
                          showNotification(isFull ? 'Luar biasa, semua level game selesai!' : 'Level game selesai!', 'success');
                        }}
                      />
                    ) : playtestingGame.type === 'modular_game2' ? (
                      <Game2
                        onGameComplete={isFull => {
                          setPlaytestScore(100);
                          showNotification(isFull ? 'Luar biasa, semua level game selesai!' : 'Level game selesai!', 'success');
                        }}
                      />
                    ) : playtestingGame.type === 'modular_game3' ? (
                      <Game3
                        onGameComplete={isFull => {
                          setPlaytestScore(100);
                          showNotification(isFull ? 'Luar biasa, semua level game selesai!' : 'Level game selesai!', 'success');
                        }}
                      />
                    ) : (
                      <MemoryGame
                        onLevelComplete={() => {
                          setPlaytestScore(100);
                          showNotification('Level Memori Selesai!', 'success');
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <CustomGameRenderer
                    code={playtestingGame.code || ''}
                    gameType={playtestingGame.type === 'custom_tsx' ? 'custom_tsx' : 'custom_html'}
                    title={playtestingGame.title}
                    instructions={playtestingGame.instructions}
                    onComplete={score => {
                      setPlaytestScore(score || 100);
                      showNotification(`Selamat! Misi game selesai dengan skor: ${score || 100} poin.`, 'success');
                    }}
                  />
                )}
              </div>

              <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
                <div>
                  {playtestScore !== null ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 size={16} />
                      Game Selesai! Skor: {playtestScore} Poin
                    </span>
                  ) : (
                    <span className="text-slate-400">Game sedang dimainkan...</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPlaytestOpen(false);
                      handleOpenEmbed(playtestingGame);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Sematkan ke Modul Ini
                  </button>
                  <button
                    onClick={() => setIsPlaytestOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: SEMATKAN GAME KE MATERI MODUL                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEmbedOpen && embedTargetGame && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Sematkan Game ke Materi</h3>
                    <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                      Game: <strong>{embedTargetGame.title}</strong>
                    </p>
                  </div>
                </div>

                <button onClick={() => setIsEmbedOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Target Modul Materi</label>
                  <select
                    value={embedModuleId}
                    onChange={e => {
                      const modId = parseInt(e.target.value);
                      setEmbedModuleId(modId);
                      const mod = modules.find(m => m.id === modId);
                      setEmbedPageId(mod?.pages?.[0]?.id);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    {modules.map(mod => (
                      <option key={mod.id} value={mod.id}>
                        Modul {mod.id}: {mod.title} ({mod.pages?.length || 0} Halaman)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Penempatan Game</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmbedMode('new_page')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        embedMode === 'new_page'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">+ Halaman Baru</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Tambahkan halaman baru di akhir modul ini
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmbedMode('replace_page')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        embedMode === 'replace_page'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">Gantikan Halaman</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Ganti salah satu halaman yang sudah ada
                      </span>
                    </button>
                  </div>
                </div>

                {embedMode === 'replace_page' && selectedModule && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pilih Halaman yang Ingin Digantikan</label>
                    <select
                      value={embedPageId}
                      onChange={e => setEmbedPageId(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    >
                      {selectedModule.pages?.map((p, pIdx) => (
                        <option key={p.id} value={p.id}>
                          Halaman {pIdx + 1}: {p.title} {p.isGame ? '(Game)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Otomatis Sinkron ke Cloud Firebase</span>
                  </p>
                  <p className="text-emerald-800">
                    Setelah disematkan, siswa yang membuka <strong>Modul {embedModuleId}</strong> akan langsung menemukan game ini dan dapat memainkannya untuk menyelesaikan modul.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEmbedOpen(false)}
                  disabled={isEmbedding}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEmbed}
                  disabled={isEmbedding}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isEmbedding ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Sematkan Game Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
