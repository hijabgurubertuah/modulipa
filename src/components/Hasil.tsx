import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  BookOpen, 
  ChevronRight,
  Award,
  Zap,
  Star,
  Calendar,
  Lock
} from 'lucide-react';
import { UserProgress, Material, Theme } from '../types';
import { hasilService } from '../services/hasil';
import { StatCard } from './StatCard';

interface HasilProps {
  progress: UserProgress;
  allMaterials: Material[];
  theme: Theme;
  onSelectMaterial: (id: string) => void;
  onStartQuiz: (id: string) => void;
}

export const Hasil: React.FC<HasilProps> = ({ progress, allMaterials, theme, onSelectMaterial, onStartQuiz }) => {
  const summary = hasilService.getSummary(progress, allMaterials);
  const materialResults = hasilService.getMaterialResults(progress, allMaterials);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<BookOpen size={20} />} 
          label="Materi Selesai" 
          value={`${summary.completedCount}/${summary.totalMaterials}`} 
          theme={theme}
        />
        <StatCard 
          icon={<BarChart3 size={20} />} 
          label="Progres Belajar" 
          value={`${summary.progressPercent}%`} 
          theme={theme}
        />
        <StatCard 
          icon={<Trophy size={20} />} 
          label="Rata-rata Skor" 
          value={summary.averageScore.toString()} 
          theme={theme}
        />
        <StatCard 
          icon={<Zap size={20} />} 
          label="Total Kuis" 
          value={summary.totalQuizzes.toString()} 
          theme={theme}
        />
      </div>

      {/* Main Achievement Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award size={160} />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
            <Star className="text-amber-400 fill-amber-400" />
            Rekap Pencapaian Modul Utama
          </h2>
          <p className="opacity-70 mb-8 max-w-lg">
            Berikut adalah detail halaman yang telah kamu selesaikan pada setiap modul utama.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {summary.moduleProgress.map((mod) => (
              <div 
                key={mod.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    {mod.id}
                  </div>
                  <span className="font-bold text-sm">Modul {mod.id}</span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase opacity-40">Hal. Selesai</div>
                  <div className="text-lg font-black text-emerald-400">{mod.completedCount}</div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
            <Zap className="text-indigo-400" />
            Detail Materi Tambahan
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {materialResults.map((material, index) => {
              const isUnlocked = progress.isIntroductionCompleted && (
                index === 0 || progress.completedMaterials.includes(allMaterials[index - 1].id)
              );

              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white/5 border border-white/10 rounded-2xl p-5 transition-all group ${isUnlocked ? 'hover:bg-white/10' : 'opacity-50'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${material.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                        {material.isCompleted ? <CheckCircle2 size={24} /> : <BookOpen size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                          {material.title}
                          {!isUnlocked && <Lock size={16} className="text-white/40" />}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs opacity-60">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {material.attemptsCount} Percobaan
                          </span>
                          {material.lastAttempt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {new Date(material.lastAttempt.date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Skor Terbaik</div>
                        <div className={`text-2xl font-black ${material.highScore >= 80 ? 'text-emerald-400' : material.highScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {material.highScore}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          disabled={!isUnlocked}
                          onClick={() => onSelectMaterial(material.id)}
                          className={`p-3 bg-white/5 rounded-xl transition-all ${isUnlocked ? 'hover:bg-white/20' : 'cursor-not-allowed opacity-30'}`}
                          title={isUnlocked ? "Baca Materi" : "Terkunci"}
                        >
                          <ChevronRight size={20} />
                        </button>
                        <button 
                          disabled={!isUnlocked}
                          onClick={() => onStartQuiz(material.id)}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg ${
                            isUnlocked ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-slate-700 cursor-not-allowed opacity-30'
                          }`}
                        >
                          {isUnlocked ? (material.isCompleted ? 'Ulang Kuis' : 'Mulai Kuis') : 'Terkunci'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
