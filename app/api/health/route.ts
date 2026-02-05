import { successResponse } from '@/lib/apiResponse';

/**
 * GET /api/health
 * Health check endpoint
 * Returns { status: "ok" } when the service is running
 */
export async function GET() {
  return successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
