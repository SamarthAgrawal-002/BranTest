import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors, validateRequiredFields } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';
import type { SavedAgency, AgencyProfile } from '@/types';

/**
 * GET /api/startup/saved
 * Get all saved agencies for the current startup user
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
    
    const savedSnapshot = await db
      .collection(COLLECTIONS.SAVED_AGENCIES)
      .where('startupUserId', '==', authResult.user.id)
      .orderBy('savedAt', 'desc')
      .get();

    const savedAgencies: SavedAgency[] = [];

    for (const doc of savedSnapshot.docs) {
      const data = doc.data();
      
      // Fetch agency details
      let agency: AgencyProfile | undefined;
      try {
        const agencyDoc = await db.collection(COLLECTIONS.AGENCIES).doc(data.agencyId).get();
        if (agencyDoc.exists) {
          const agencyData = agencyDoc.data();
          agency = {
            id: agencyDoc.id,
            userId: agencyData?.userId,
            name: agencyData?.name,
            categories: agencyData?.categories || [],
            industries: agencyData?.industries || [],
            budgetMin: agencyData?.budgetMin,
            budgetMax: agencyData?.budgetMax,
            areas: agencyData?.areas || [],
            keywords: agencyData?.keywords || [],
            experienceLevel: agencyData?.experienceLevel,
            thinkingStyle: agencyData?.thinkingStyle,
            description: agencyData?.description,
            createdAt: agencyData?.createdAt?.toDate(),
            updatedAt: agencyData?.updatedAt?.toDate(),
          };
        }
      } catch {
        // Agency might have been deleted
      }

      savedAgencies.push({
        id: doc.id,
        startupUserId: data.startupUserId,
        agencyId: data.agencyId,
        savedAt: data.savedAt?.toDate(),
        agency,
      });
    }

    return successResponse({
      savedAgencies,
      total: savedAgencies.length,
    });
  } catch (error) {
    console.error('Get saved agencies error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}

/**
 * POST /api/startup/saved
 * Save an agency for the current startup user
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    if (authResult.user.role !== 'startup') {
      return ApiErrors.FORBIDDEN();
    }

    const body = await request.json();
    
    const missingFields = validateRequiredFields(body, ['agencyId']);
    if (missingFields.length > 0) {
      return ApiErrors.MISSING_FIELDS(missingFields);
    }

    const db = getFirestoreDb();

    // Check if agency exists
    const agencyDoc = await db.collection(COLLECTIONS.AGENCIES).doc(body.agencyId).get();
    if (!agencyDoc.exists) {
      return ApiErrors.NOT_FOUND('Agency');
    }

    // Check if already saved
    const existingSnapshot = await db
      .collection(COLLECTIONS.SAVED_AGENCIES)
      .where('startupUserId', '==', authResult.user.id)
      .where('agencyId', '==', body.agencyId)
      .get();

    if (!existingSnapshot.empty) {
      return ApiErrors.ALREADY_EXISTS('Saved agency');
    }

    const savedData = {
      startupUserId: authResult.user.id,
      agencyId: body.agencyId,
      savedAt: new Date(),
    };

    const docRef = await db.collection(COLLECTIONS.SAVED_AGENCIES).add(savedData);

    const savedAgency: SavedAgency = {
      id: docRef.id,
      ...savedData,
    };

    return successResponse(savedAgency, 201);
  } catch (error) {
    console.error('Save agency error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
