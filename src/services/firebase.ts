import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Master Firebase Configuration (Pusat Data Bersama & Terkunci: gubersmart@gmail.com)
// Project ID: modul-ipa-97065
const MASTER_FIREBASE_CONFIG = {
  projectId: "modul-ipa-97065",
  appId: "1:305013950051:web:e998f48c369580fc951a56",
  apiKey: "AIzaSyBDFxgZz3IVJWZJ7hXfn8ZNxnhrUz-Q7K4",
  authDomain: "modul-ipa-97065.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "modul-ipa-97065.firebasestorage.app",
  messagingSenderId: "305013950051"
};

// Selalu prioritaskan MASTER_FIREBASE_CONFIG milik gubersmart@gmail.com
// agar saat di-remix oleh akun lain, database tetap menyatu ke pusat data master gubersmart@gmail.com
const activeConfig = {
  projectId: MASTER_FIREBASE_CONFIG.projectId,
  appId: MASTER_FIREBASE_CONFIG.appId,
  apiKey: MASTER_FIREBASE_CONFIG.apiKey,
  authDomain: MASTER_FIREBASE_CONFIG.authDomain,
  storageBucket: MASTER_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: MASTER_FIREBASE_CONFIG.messagingSenderId,
  firestoreDatabaseId: MASTER_FIREBASE_CONFIG.firestoreDatabaseId
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: activeConfig.apiKey,
      authDomain: activeConfig.authDomain,
      projectId: activeConfig.projectId,
      storageBucket: activeConfig.storageBucket,
      messagingSenderId: activeConfig.messagingSenderId,
      appId: activeConfig.appId,
    });
  } else {
    app = getApp();
  }

  try {
    auth = getAuth(app);
  } catch (authErr) {
    console.warn('Auth init note:', authErr);
    auth = getAuth();
  }

  const dbId = (activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== '(default)')
    ? activeConfig.firestoreDatabaseId
    : undefined;

  const firestoreSettings = {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalAutoDetectLongPolling: true,
    experimentalForceLongPolling: false,
    ignoreUndefinedProperties: true
  };

  try {
    if (dbId) {
      db = initializeFirestore(app, firestoreSettings, dbId);
    } else {
      db = initializeFirestore(app, firestoreSettings);
    }
  } catch {
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization error, fallback:', error);
  app = getApps()[0] || initializeApp({
    apiKey: activeConfig.apiKey,
    projectId: activeConfig.projectId,
    appId: activeConfig.appId,
  });
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, db, auth, activeConfig as firebaseConfigJson };


