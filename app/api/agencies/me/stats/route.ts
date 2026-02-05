import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';
import type { AgencyStats, AgencyProfile } from '@/types';

/**
 * GET /api/agencies/me/stats
 * Get stats for the current user's agency profile
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
    
    // Get agency profile
    const agencySnapshot = await db
      .collection(COLLECTIONS.AGENCIES)
      .where('userId', '==', authResult.user.id)
      .limit(1)
      .get();

    if (agencySnapshot.empty) {
      return successResponse<AgencyStats>({
        profileCompleteness: 0,
        totalViews: 0,
        savedCount: 0,
      });
    }

    const agencyDoc = agencySnapshot.docs[0];
    const agencyData = agencyDoc.data() as AgencyProfile;
    const agencyId = agencyDoc.id;

    // Calculate profile completeness
    const requiredFields = ['name', 'categories', 'industries', 'budgetMin', 'budgetMax', 'areas', 'thinkingStyle', 'description', 'keywords', 'experienceLevel'];
    const filledFields = requiredFields.filter(field => {
      const value = agencyData[field as keyof AgencyProfile];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
    const profileCompleteness = Math.round((filledFields.length / requiredFields.length) * 100);

    // Get saved count (how many startups saved this agency)
    let savedCount = 0;
    try {
      const savedSnapshot = await db
        .collection(COLLECTIONS.SAVED_AGENCIES || 'savedAgencies')
        .where('agencyId', '==', agencyId)
        .get();
      savedCount = savedSnapshot.size;
    } catch {
      // Collection might not exist yet
    }

    // Views would typically come from an analytics collection
    // For now, return 0 as placeholder
    const totalViews = 0;

    const stats: AgencyStats = {
      profileCompleteness,
      totalViews,
      savedCount,
    };

    return successResponse(stats);
  } catch (error) {
    console.error('Get agency stats error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
