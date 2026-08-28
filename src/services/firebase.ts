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

// Firebase Configuration dynamically loaded from firebase-applet-config.json
const activeConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  firestoreDatabaseId: (firebaseConfigJson as any).firestoreDatabaseId || "(default)"
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


