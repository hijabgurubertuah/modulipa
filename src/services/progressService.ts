/**
 * Service to calculate overall learning progress.
 */

export const progressService = {
  getModuleProgress: (moduleNumber: number) => {
    const completedStr = localStorage.getItem(`ipa_modul_${moduleNumber}_completed_pages`);
    if (!completedStr) return 0;
    try {
      const completed = JSON.parse(completedStr);
      // We don't know the total pages unless we load the service, 
      // but we can at least return the count.
      return Array.isArray(completed) ? completed.length : 0;
    } catch (e) {
      return 0;
    }
  },
  
  getTotalProgress: (allModules: number[]) => {
    let totalCompleted = 0;
    allModules.forEach(num => {
      totalCompleted += progressService.getModuleProgress(num);
    });
    return totalCompleted;
  }
};
