import { UserProgress, Material } from '../types';

export const hasilService = {
  getSummary: (progress: UserProgress, allMaterials: Material[]) => {
    // Basic materials from legacy structure
    const totalMaterials = allMaterials.length;
    const completedCount = progress.completedMaterials.length;
    
    // Modules 1-8
    let modulesCompletedPages = 0;
    let modulesTotalPossiblePages = 0;
    const moduleProgress = [];

    for (let i = 1; i <= 8; i++) {
        const completedStr = localStorage.getItem(`ipa_modul_${i}_completed_pages`);
        const completed = completedStr ? JSON.parse(completedStr) : [];
        modulesCompletedPages += completed.length;
        // In a real app we'd load the service to get total pages, but we'll assume a standard for now
        // or just report the count.
        moduleProgress.push({ id: i, completedCount: completed.length });
    }

    const averageScore = progress.quizHistory.length > 0 
      ? Math.round(progress.quizHistory.reduce((acc, curr) => acc + curr.score, 0) / progress.quizHistory.length)
      : 0;

    return {
      totalMaterials,
      completedCount,
      progressPercent: totalMaterials > 0 ? Math.round((completedCount / totalMaterials) * 100) : 0,
      averageScore,
      totalQuizzes: progress.quizHistory.length,
      modulesCompletedPages,
      moduleProgress
    };
  },

  getMaterialResults: (progress: UserProgress, allMaterials: Material[]) => {
    return allMaterials.map(material => {
      const highScore = progress.highScores[material.id] || 0;
      const isCompleted = progress.completedMaterials.includes(material.id);
      const attempts = progress.quizHistory.filter(h => h.materialId === material.id);
      
      return {
        ...material,
        highScore,
        isCompleted,
        attemptsCount: attempts.length,
        lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : null
      };
    });
  }
};
