import { NextRequest } from 'next/server';
import { getFirebaseAuth, getFirestoreDb, COLLECTIONS } from './firebaseAdmin';
import type { User } from '@/types';

export interface AuthResult {
  authenticated: boolean;
  user: User | null;
  error: string | null;
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Verify Firebase ID token and return user data
 * Reusable auth helper for protected routes
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = extractBearerToken(request);
    
    if (!token) {
      return {
        authenticated: false,
        user: null,
        error: 'No token provided',
      };
    }

    // Verify token with Firebase Auth
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Fetch user data from Firestore
    const db = getFirestoreDb();
    const userDoc = await db
      .collection(COLLECTIONS.USERS)
      .doc(decodedToken.uid)
      .get();
    
    if (!userDoc.exists) {
      return {
        authenticated: false,
        user: null,
        error: 'User not found',
      };
    }

    const userData = userDoc.data();
    const user: User = {
      id: userDoc.id,
      role: userData?.role,
      name: userData?.name,
      email: userData?.email,
      createdAt: userData?.createdAt?.toDate(),
      updatedAt: userData?.updatedAt?.toDate(),
    };

    return {
      authenticated: true,
      user,
      error: null,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      authenticated: false,
      user: null,
      error: 'Invalid or expired token',
    };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, requiredRole: User['role']): boolean {
  return user?.role === requiredRole;
}

/**
 * Create a custom token for a user (for login flow)
 */
export async function createCustomToken(uid: string): Promise<string> {
  const auth = getFirebaseAuth();
  return auth.createCustomToken(uid);
}
