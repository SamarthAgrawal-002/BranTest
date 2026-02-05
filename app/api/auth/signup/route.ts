import { NextRequest } from 'next/server';
import { getFirebaseAuth, getFirestoreDb, COLLECTIONS, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors, validateRequiredFields } from '@/lib/apiResponse';
import type { SignupRequest, User, AuthResponse } from '@/types';

/**
 * POST /api/auth/signup
 * Register a new user (startup or agency)
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "name": "John Doe",
 *   "role": "startup" | "agency"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseAdminConfigured()) {
      console.error('[v0] Signup failed: Firebase Admin SDK not configured');
      return ApiErrors.INTERNAL_ERROR('Firebase is not configured. Please set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_KEY environment variables.');
    }

    const body: SignupRequest = await request.json();

    // Validate required fields
    const missingFields = validateRequiredFields(body, ['email', 'password', 'name', 'role']);
    if (missingFields.length > 0) {
      return ApiErrors.MISSING_FIELDS(missingFields);
    }

    // Validate role
    if (!['startup', 'agency'].includes(body.role)) {
      return ApiErrors.INVALID_INPUT('Role must be either "startup" or "agency"');
    }

    // Validate password strength
    if (body.password.length < 6) {
      return ApiErrors.INVALID_INPUT('Password must be at least 6 characters');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return ApiErrors.INVALID_INPUT('Invalid email format');
    }

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: body.email,
        password: body.password,
        displayName: body.name,
      });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/email-already-exists') {
        return ApiErrors.ALREADY_EXISTS('User with this email');
      }
      throw error;
    }

    // Store additional user data in Firestore
    const now = new Date();
    const userData = {
      role: body.role,
      name: body.name,
      email: body.email,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userData);

    // Create custom token for immediate authentication
    const token = await auth.createCustomToken(userRecord.uid);

    const user: User = {
      id: userRecord.uid,
      ...userData,
    };

    const response: AuthResponse = {
      user,
      token,
    };

    return successResponse(response, 201);
  } catch (error) {
    console.error('[v0] Signup error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return ApiErrors.INTERNAL_ERROR(message);
  }
}
