import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { app, auth } from './firebase';

const provider = new GoogleAuthProvider();
// Workspace Scopes for direct Google Sheets & Drive manipulation
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory (never localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google OAuth. Pastikan izin telah disetujui.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    let errorMsg = error?.message || 'Gagal login dengan Google.';
    if (error?.code === 'auth/popup-blocked') {
      errorMsg = 'Jendela popup Google Sign-In diblokir oleh browser. Harap izinkan popup atau gunakan metode Google Apps Script (bebas login).';
    } else if (error?.code === 'auth/unauthorized-domain') {
      errorMsg = 'Domain aplikasi ini belum diizinkan di Firebase Console. Gunakan Google Apps Script Web App yang bekerja langsung tanpa perlu login.';
    } else if (error?.code === 'auth/popup-closed-by-user') {
      errorMsg = 'Proses login dibatalkan (jendela ditutup).';
    }
    throw new Error(errorMsg);
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const logoutGoogle = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  cachedAccessToken = null;
};
