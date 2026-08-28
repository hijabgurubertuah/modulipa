/**
 * Service for handling home/landing page logic, specifically user session.
 */

export const homeService = {
  /**
   * Saves the username to local storage.
   */
  saveUser: (username: string) => {
    localStorage.setItem('ipa_user', username);
  },

  /**
   * Gets the saved username from local storage.
   */
  getUser: (): string | null => {
    return localStorage.getItem('ipa_user');
  },

  /**
   * Removes the user from local storage.
   */
  logout: () => {
    localStorage.removeItem('ipa_user');
  },

  /**
   * Gets saved progress from local storage.
   */
  getProgress: () => {
    const saved = localStorage.getItem('ipa_progress');
    return saved ? JSON.parse(saved) : null;
  },

  /**
   * Saves progress to local storage.
   */
  saveProgress: (progress: any) => {
    localStorage.setItem('ipa_progress', JSON.stringify(progress));
  }
};
