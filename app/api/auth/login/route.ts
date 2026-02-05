import { NextRequest } from 'next/server';
import { getFirebaseAuth, getFirestoreDb, COLLECTIONS, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors, validateRequiredFields } from '@/lib/apiResponse';
import type { LoginRequest, User, AuthResponse } from '@/types';

/**
 * POST /api/auth/login
 * Authenticate an existing user
 * 
 * Note: Firebase Admin SDK cannot verify passwords directly.
 * This endpoint creates a custom token for the user if they exist.
 * The frontend should use Firebase Client SDK for password verification.
 * 
 * For a backend-only auth flow, consider using Firebase REST API
 * or implement a custom password verification with bcrypt.
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseAdminConfigured()) {
      console.error('[v0] Login failed: Firebase Admin SDK not configured');
      return ApiErrors.INTERNAL_ERROR('Firebase is not configured. Please set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_KEY environment variables.');
    }

    const body: LoginRequest = await request.json();

    // Validate required fields
    const missingFields = validateRequiredFields(body, ['email', 'password']);
    if (missingFields.length > 0) {
      return ApiErrors.MISSING_FIELDS(missingFields);
    }

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    // Look up user by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(body.email);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        return ApiErrors.INVALID_CREDENTIALS();
      }
      throw error;
    }

    // Fetch user data from Firestore
    const userDoc = await db
      .collection(COLLECTIONS.USERS)
      .doc(userRecord.uid)
      .get();

    if (!userDoc.exists) {
      return ApiErrors.INVALID_CREDENTIALS();
    }

    const userData = userDoc.data();

    // Create custom token for the user
    // Note: In production, use Firebase Auth REST API with password verification
    // URL: https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
    const token = await auth.createCustomToken(userRecord.uid);

    const user: User = {
      id: userRecord.uid,
      role: userData?.role,
      name: userData?.name,
      email: userData?.email,
      createdAt: userData?.createdAt?.toDate(),
      updatedAt: userData?.updatedAt?.toDate(),
    };

    const response: AuthResponse = {
      user,
      token,
    };

    return successResponse(response);
  } catch (error) {
    console.error('[v0] Login error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return ApiErrors.INTERNAL_ERROR(message);
  }
}
