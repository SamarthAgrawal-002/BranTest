import { NextResponse } from 'next/server';
import type { ApiResponse, ApiError } from '@/types';

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status }
  );
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code, message },
    },
    { status }
  );
}

// Predefined error responses for common scenarios
export const ApiErrors = {
  // Auth errors
  INVALID_CREDENTIALS: () => 
    errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401),
  
  UNAUTHORIZED: () => 
    errorResponse('UNAUTHORIZED', 'Authentication required', 401),
  
  INVALID_TOKEN: () => 
    errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401),
  
  // Validation errors
  MISSING_FIELDS: (fields: string[]) => 
    errorResponse('MISSING_FIELDS', `Missing required fields: ${fields.join(', ')}`, 400),
  
  INVALID_INPUT: (message: string) => 
    errorResponse('INVALID_INPUT', message, 400),
  
  // Resource errors
  NOT_FOUND: (resource: string) => 
    errorResponse('NOT_FOUND', `${resource} not found`, 404),
  
  ALREADY_EXISTS: (resource: string) => 
    errorResponse('ALREADY_EXISTS', `${resource} already exists`, 409),
  
  // Server errors
  INTERNAL_ERROR: (message?: string) => 
    errorResponse('INTERNAL_ERROR', message || 'An unexpected error occurred', 500),
  
  // Permission errors
  FORBIDDEN: () => 
    errorResponse('FORBIDDEN', 'You do not have permission to perform this action', 403),
};

/**
 * Validate required fields in request body
 * Returns array of missing field names, or empty array if all present
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  requiredFields: (keyof T)[]
): string[] {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(String(field));
    }
  }
  
  return missing;
}
