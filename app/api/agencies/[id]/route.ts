import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';
import type { AgencyProfile } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/agencies/:id
 * Get a specific agency profile by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return ApiErrors.UNAUTHORIZED();
    }

    const { id } = await params;

    if (!id) {
      return ApiErrors.INVALID_INPUT('Agency ID is required');
    }

    const db = getFirestoreDb();
    const doc = await db.collection(COLLECTIONS.AGENCIES).doc(id).get();

    if (!doc.exists) {
      return ApiErrors.NOT_FOUND('Agency');
    }

    const data = doc.data();
    const agency: AgencyProfile = {
      id: doc.id,
      userId: data?.userId,
      name: data?.name,
      categories: data?.categories || [],
      industries: data?.industries || [],
      budgetMin: data?.budgetMin,
      budgetMax: data?.budgetMax,
      areas: data?.areas || [],
      keywords: data?.keywords || [],
      experienceLevel: data?.experienceLevel,
      thinkingStyle: data?.thinkingStyle,
      description: data?.description,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
    };

    return successResponse(agency);
  } catch (error) {
    console.error('Get agency error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}

/**
 * PUT /api/agencies/:id
 * Update an agency profile (owner only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    const { id } = await params;

    if (!id) {
      return ApiErrors.INVALID_INPUT('Agency ID is required');
    }

    const db = getFirestoreDb();
    const docRef = db.collection(COLLECTIONS.AGENCIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return ApiErrors.NOT_FOUND('Agency');
    }

    const existingData = doc.data();

    // Only the owner can update their profile
    if (existingData?.userId !== authResult.user.id) {
      return ApiErrors.FORBIDDEN();
    }

    const body = await request.json();

    // Validate budget if provided
    const budgetMin = body.budgetMin ?? existingData?.budgetMin;
    const budgetMax = body.budgetMax ?? existingData?.budgetMax;
    
    if (budgetMin > budgetMax) {
      return ApiErrors.INVALID_INPUT('budgetMin cannot be greater than budgetMax');
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      'name', 'categories', 'industries', 'budgetMin', 'budgetMax',
      'areas', 'keywords', 'experienceLevel', 'thinkingStyle', 'description'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();

    const agency: AgencyProfile = {
      id: updatedDoc.id,
      userId: data?.userId,
      name: data?.name,
      categories: data?.categories || [],
      industries: data?.industries || [],
      budgetMin: data?.budgetMin,
      budgetMax: data?.budgetMax,
      areas: data?.areas || [],
      keywords: data?.keywords || [],
      experienceLevel: data?.experienceLevel,
      thinkingStyle: data?.thinkingStyle,
      description: data?.description,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
    };

    return successResponse(agency);
  } catch (error) {
    console.error('Update agency error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}

/**
 * DELETE /api/agencies/:id
 * Delete an agency profile (owner only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    const { id } = await params;

    if (!id) {
      return ApiErrors.INVALID_INPUT('Agency ID is required');
    }

    const db = getFirestoreDb();
    const docRef = db.collection(COLLECTIONS.AGENCIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return ApiErrors.NOT_FOUND('Agency');
    }

    const existingData = doc.data();

    // Only the owner can delete their profile
    if (existingData?.userId !== authResult.user.id) {
      return ApiErrors.FORBIDDEN();
    }

    await docRef.delete();

    return successResponse({ message: 'Agency profile deleted successfully' });
  } catch (error) {
    console.error('Delete agency error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
