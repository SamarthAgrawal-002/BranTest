import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';
import type { MatchHistory } from '@/types';

/**
 * GET /api/startup/matches
 * Get match history for the current startup user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    if (authResult.user.role !== 'startup') {
      return ApiErrors.FORBIDDEN();
    }

    const db = getFirestoreDb();
    
    const historySnapshot = await db
      .collection(COLLECTIONS.MATCH_HISTORY)
      .where('startupUserId', '==', authResult.user.id)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history: MatchHistory[] = historySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        startupUserId: data.startupUserId,
        preferences: data.preferences,
        matchCount: data.matchCount,
        topMatchAgencyId: data.topMatchAgencyId,
        topMatchScore: data.topMatchScore,
        createdAt: data.createdAt?.toDate(),
      };
    });

    return successResponse({
      history,
      total: history.length,
    });
  } catch (error) {
    console.error('Get match history error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
