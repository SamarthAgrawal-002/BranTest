import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Firebase Admin singleton instance
let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Check if Firebase Admin is configured
 */
export function isFirebaseAdminConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY !== '{}'
  );
}

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for configuration
 * Implements singleton pattern to prevent multiple initializations
 */
function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (!isFirebaseAdminConfigured()) {
    console.error('[v0] Firebase Admin not configured. Missing environment variables:');
    console.error('[v0] - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
    console.error('[v0] - FIREBASE_SERVICE_ACCOUNT_KEY:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'MISSING');
    throw new Error('Firebase Admin SDK is not configured. Please set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_KEY environment variables.');
  }

  // Parse the service account from environment variable
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch (e) {
    console.error('[v0] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:', e);
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

/**
 * Get Firebase Admin App instance
 */
export function getFirebaseApp(): App {
  if (!app) {
    app = initializeFirebaseAdmin();
  }
  return app;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

// Collection names as constants for consistency
export const COLLECTIONS = {
  USERS: 'users',
  AGENCIES: 'agencies',
  SAVED_AGENCIES: 'savedAgencies',
  MATCH_HISTORY: 'matchHistory',
} as const;
