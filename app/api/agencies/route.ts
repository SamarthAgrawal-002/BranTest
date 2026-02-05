import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors } from '@/lib/apiResponse';
import { verifyAuth } from '@/lib/auth';
import type { AgencyProfile, AgencyFilterParams } from '@/types';
import { FirebaseFirestore } from 'firebase-admin/firestore';

/**
 * GET /api/agencies
 * List agencies with optional filtering
 * 
 * Query parameters:
 * - category: Filter by category (SEO, Branding, etc.)
 * - area: Filter by area (Remote, India, Bangalore, etc.)
 * - budgetMin: Minimum budget
 * - budgetMax: Maximum budget
 * - keyword: Search in keywords and description
 * - industry: Filter by industry
 * - thinkingStyle: Filter by thinking style
 * - experienceLevel: Filter by experience level
 * 
 * Example: GET /api/agencies?category=SEO&area=Remote&budgetMax=50000
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return ApiErrors.UNAUTHORIZED();
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const filters: AgencyFilterParams = {
      category: searchParams.get('category') as AgencyFilterParams['category'] || undefined,
      area: searchParams.get('area') || undefined,
      budgetMin: searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined,
      budgetMax: searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined,
      keyword: searchParams.get('keyword') || undefined,
      industry: searchParams.get('industry') as AgencyFilterParams['industry'] || undefined,
      thinkingStyle: searchParams.get('thinkingStyle') as AgencyFilterParams['thinkingStyle'] || undefined,
      experienceLevel: searchParams.get('experienceLevel') as AgencyFilterParams['experienceLevel'] || undefined,
    };

    const db = getFirestoreDb();
    let query: FirebaseFirestore.Query = db.collection(COLLECTIONS.AGENCIES);

    // Apply Firestore-compatible filters
    // Note: Firestore has limitations on compound queries
    // Complex filtering is done in-memory after fetching
    
    if (filters.thinkingStyle) {
      query = query.where('thinkingStyle', '==', filters.thinkingStyle);
    }
    
    if (filters.experienceLevel) {
      query = query.where('experienceLevel', '==', filters.experienceLevel);
    }

    const snapshot = await query.get();
    
    let agencies: AgencyProfile[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
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
    });

    // Apply in-memory filters for array and range queries
    if (filters.category) {
      agencies = agencies.filter(a => a.categories.includes(filters.category!));
    }

    if (filters.area) {
      agencies = agencies.filter(a => 
        a.areas.some(area => area.toLowerCase().includes(filters.area!.toLowerCase()))
      );
    }

    if (filters.industry) {
      agencies = agencies.filter(a => a.industries.includes(filters.industry!));
    }

    if (filters.budgetMin !== undefined) {
      agencies = agencies.filter(a => a.budgetMax >= filters.budgetMin!);
    }

    if (filters.budgetMax !== undefined) {
      agencies = agencies.filter(a => a.budgetMin <= filters.budgetMax!);
    }

    // Keyword search across keywords, name, and description
    if (filters.keyword) {
      const searchTerm = filters.keyword.toLowerCase();
      agencies = agencies.filter(a => 
        a.keywords.some(k => k.toLowerCase().includes(searchTerm)) ||
        a.name.toLowerCase().includes(searchTerm) ||
        a.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by relevance (for now, by number of matching filters)
    agencies.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Boost agencies with more keywords matching
      if (filters.keyword) {
        const searchTerm = filters.keyword.toLowerCase();
        scoreA = a.keywords.filter(k => k.toLowerCase().includes(searchTerm)).length;
        scoreB = b.keywords.filter(k => k.toLowerCase().includes(searchTerm)).length;
      }

      return scoreB - scoreA;
    });

    return successResponse({
      agencies,
      total: agencies.length,
      filters: filters,
    });
  } catch (error) {
    console.error('Get agencies error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}

/**
 * POST /api/agencies
 * Create a new agency profile (agency users only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    // Only agency users can create profiles
    if (authResult.user.role !== 'agency') {
      return ApiErrors.FORBIDDEN();
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'categories', 'budgetMin', 'budgetMax', 'areas', 'thinkingStyle', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return ApiErrors.MISSING_FIELDS(missingFields);
    }

    // Validate arrays
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return ApiErrors.INVALID_INPUT('Categories must be a non-empty array');
    }

    if (!Array.isArray(body.areas) || body.areas.length === 0) {
      return ApiErrors.INVALID_INPUT('Areas must be a non-empty array');
    }

    // Validate budget
    if (body.budgetMin > body.budgetMax) {
      return ApiErrors.INVALID_INPUT('budgetMin cannot be greater than budgetMax');
    }

    const db = getFirestoreDb();
    
    // Check if agency profile already exists for this user
    const existingProfile = await db
      .collection(COLLECTIONS.AGENCIES)
      .where('userId', '==', authResult.user.id)
      .get();

    if (!existingProfile.empty) {
      return ApiErrors.ALREADY_EXISTS('Agency profile for this user');
    }

    const now = new Date();
    const agencyData = {
      userId: authResult.user.id,
      name: body.name,
      categories: body.categories,
      industries: body.industries || [],
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      areas: body.areas,
      keywords: body.keywords || [],
      experienceLevel: body.experienceLevel || 'growth',
      thinkingStyle: body.thinkingStyle,
      description: body.description,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTIONS.AGENCIES).add(agencyData);

    const agency: AgencyProfile = {
      id: docRef.id,
      ...agencyData,
    };

    return successResponse(agency, 201);
  } catch (error) {
    console.error('Create agency error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
