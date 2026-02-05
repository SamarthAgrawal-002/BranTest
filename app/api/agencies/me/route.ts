import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';
import type { AgencyProfile } from '@/types';

/**
 * GET /api/agencies/me
 * Get the current user's agency profile
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    if (authResult.user.role !== 'agency') {
      return ApiErrors.FORBIDDEN();
    }

    const db = getFirestoreDb();
    const snapshot = await db
      .collection(COLLECTIONS.AGENCIES)
      .where('userId', '==', authResult.user.id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return successResponse(null);
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const agency: AgencyProfile = {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      categories: data.categories || [],
      industries: data.industries || [],
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      areas: data.areas || [],
      keywords: data.keywords || [],
      experienceLevel: data.experienceLevel,
      thinkingStyle: data.thinkingStyle,
      description: data.description,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };

    return successResponse(agency);
  } catch (error) {
    console.error('Get my agency profile error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
