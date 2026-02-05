import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ agencyId: string }>;
}

/**
 * DELETE /api/startup/saved/:agencyId
 * Remove a saved agency
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    if (authResult.user.role !== 'startup') {
      return ApiErrors.FORBIDDEN();
    }

    const { agencyId } = await params;

    if (!agencyId) {
      return ApiErrors.INVALID_INPUT('Agency ID is required');
    }

    const db = getFirestoreDb();

    // Find the saved agency record
    const savedSnapshot = await db
      .collection(COLLECTIONS.SAVED_AGENCIES)
      .where('startupUserId', '==', authResult.user.id)
      .where('agencyId', '==', agencyId)
      .get();

    if (savedSnapshot.empty) {
      return ApiErrors.NOT_FOUND('Saved agency');
    }

    // Delete the record
    await savedSnapshot.docs[0].ref.delete();

    return successResponse({ message: 'Agency unsaved successfully' });
  } catch (error) {
    console.error('Unsave agency error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
