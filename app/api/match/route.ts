import { NextRequest } from 'next/server';
import { getFirestoreDb, COLLECTIONS } from '@/lib/firebaseAdmin';
import { successResponse, ApiErrors, validateRequiredFields } from '@/lib/apiResponse';
import { verifyAuth, hasRole } from '@/lib/auth';
import { matchAgencies } from '@/lib/matchEngine';
import type { AgencyProfile, StartupPreferences } from '@/types';

/**
 * POST /api/match
 * Thinking Match Engine - Core differentiator
 * 
 * Matches startups with agencies based on:
 * - Thinking style alignment (creative, data, hybrid)
 * - Budget compatibility
 * - Category expertise
 * - Industry experience
 * - Geographic preferences
 * - Keyword relevance
 * 
 * Request body:
 * {
 *   "budget": 50000,
 *   "categories": ["SEO", "Content Marketing"],
 *   "industries": ["SaaS", "B2B"],
 *   "areas": ["Remote", "Bangalore"],
 *   "thinkingPreference": "data",
 *   "experienceLevel": "growth",
 *   "keywords": ["growth hacking", "PLG"]
 * }
 * 
 * Response includes:
 * - Matched agencies sorted by relevance
 * - thinking_match_score (0-100)
 * - "why_matched" explanation array
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiErrors.UNAUTHORIZED();
    }

    // Only startups can use the match engine
    if (!hasRole(authResult.user, 'startup')) {
      return ApiErrors.FORBIDDEN();
    }

    const body = await request.json();

    // Validate required fields
    const missingFields = validateRequiredFields(body, ['budget', 'categories', 'thinkingPreference']);
    if (missingFields.length > 0) {
      return ApiErrors.MISSING_FIELDS(missingFields);
    }

    // Validate budget
    if (typeof body.budget !== 'number' || body.budget <= 0) {
      return ApiErrors.INVALID_INPUT('Budget must be a positive number');
    }

    // Validate categories
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return ApiErrors.INVALID_INPUT('Categories must be a non-empty array');
    }

    // Validate thinking preference
    const validThinkingStyles = ['creative', 'data', 'hybrid'];
    if (!validThinkingStyles.includes(body.thinkingPreference)) {
      return ApiErrors.INVALID_INPUT('thinkingPreference must be one of: creative, data, hybrid');
    }

    const preferences: StartupPreferences = {
      budget: body.budget,
      categories: body.categories,
      industries: body.industries || [],
      areas: body.areas || [],
      thinkingPreference: body.thinkingPreference,
      experienceLevel: body.experienceLevel,
      keywords: body.keywords || [],
    };

    // Fetch all agencies from Firestore
    const db = getFirestoreDb();
    const snapshot = await db.collection(COLLECTIONS.AGENCIES).get();

    const agencies: AgencyProfile[] = snapshot.docs.map(doc => {
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

    // Run the match engine
    // Filter to only include agencies with at least 20% match
    const minMatchScore = body.minScore ?? 20;
    const matchResults = matchAgencies(preferences, agencies, minMatchScore);

    // Limit results if specified
    const limit = body.limit ?? 20;
    const limitedResults = matchResults.slice(0, limit);

    // Save match history
    try {
      const topMatch = limitedResults[0];
      await db.collection(COLLECTIONS.MATCH_HISTORY).add({
        startupUserId: authResult.user.id,
        preferences,
        matchCount: matchResults.length,
        topMatchAgencyId: topMatch?.agency.id,
        topMatchScore: topMatch?.overallScore,
        createdAt: new Date(),
      });
    } catch (historyError) {
      // Don't fail the request if history save fails
      console.error('Failed to save match history:', historyError);
    }

    return successResponse({
      matches: limitedResults.map(result => ({
        agency: {
          id: result.agency.id,
          name: result.agency.name,
          categories: result.agency.categories,
          industries: result.agency.industries,
          budgetMin: result.agency.budgetMin,
          budgetMax: result.agency.budgetMax,
          areas: result.agency.areas,
          thinkingStyle: result.agency.thinkingStyle,
          experienceLevel: result.agency.experienceLevel,
          description: result.agency.description,
        },
        thinking_match_score: result.thinkingMatchScore,
        overall_score: result.overallScore,
        why_matched: result.whyMatched,
      })),
      total_matches: matchResults.length,
      preferences_used: preferences,
    });
  } catch (error) {
    console.error('Match error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
